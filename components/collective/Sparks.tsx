"use client";
// Искры на чёрном фоне: тысяча с небольшим точек медленно поднимается, мерцает и расступается
// перед курсором, а потом мягко возвращается на место (пружина, как у декора за курсором в
// setup/motion-examples.md). Касание на телефоне толкает искры волной от пальца.
// Рисуем точками в WebGL: расчёт на процессоре, в видеокарту уходит один буфер за кадр.
// Без WebGL искр нет, остаётся сетка. При «уменьшить движение» искры стоят на месте.
import { useEffect, useRef } from "react";

const VERT = `
attribute vec4 aP; // x, y в пикселях страницы, размер, яркость
uniform vec2 uSize;
uniform float uDpr;
varying float vA;
void main() {
  gl_Position = vec4(aP.x / uSize.x * 2.0 - 1.0, 1.0 - aP.y / uSize.y * 2.0, 0.0, 1.0);
  gl_PointSize = aP.z * uDpr;
  vA = aP.w;
}`;
const FRAG = `
precision mediump float;
uniform vec3 uColor;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.1, d) * vA;
  gl_FragColor = vec4(uColor * a, a);
}`;

// пружина возврата: stiffness 150, damping 24, mass 0.6
const K = 150 / 0.6;
const C = 24 / 0.6;
const RADIUS = 190; // px вокруг курсора
const PUSH = 26000; // px/с² в центре: искры отходят примерно на 100 px
const STEP = 1 / 240; // шаг пружины, чтобы она не раскачивалась на редких кадрах

type Field = {
  n: number;
  hx: Float32Array; hy: Float32Array; // «дом» искры: медленно плывёт вверх
  ox: Float32Array; oy: Float32Array; // отклонение от дома
  vx: Float32Array; vy: Float32Array;
  size: Float32Array; base: Float32Array; speed: Float32Array; phase: Float32Array;
  glow: Float32Array;
  buf: Float32Array;
};

function makeField(w: number, h: number, phone: boolean): Field {
  const n = Math.round(Math.min((w * h) / (phone ? 650 : 480), phone ? 900 : 2800));
  const f: Field = {
    n,
    hx: new Float32Array(n), hy: new Float32Array(n),
    ox: new Float32Array(n), oy: new Float32Array(n),
    vx: new Float32Array(n), vy: new Float32Array(n),
    size: new Float32Array(n), base: new Float32Array(n), speed: new Float32Array(n), phase: new Float32Array(n),
    glow: new Float32Array(n),
    buf: new Float32Array(n * 4),
  };
  for (let i = 0; i < n; i++) {
    f.hx[i] = Math.random() * w;
    f.hy[i] = Math.random() * h;
    const big = Math.random() < 0.06;
    f.size[i] = big ? 3.5 + Math.random() * 2 : 1.4 + Math.random() * 1.8;
    // искр больше внизу, как у тлеющих угольков: вверху они гаснут
    f.base[i] = big ? 0.7 + Math.random() * 0.3 : 0.2 + Math.random() * 0.5;
    f.speed[i] = 4 + Math.random() * 14;
    f.phase[i] = Math.random() * Math.PI * 2;
  }
  return f;
}

export function Sparks({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true, depth: false, stencil: false });
    if (!gl) return;

    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const aP = gl.getAttribLocation(prog, "aP");
    const uSize = gl.getUniformLocation(prog, "uSize");
    const uDpr = gl.getUniformLocation(prog, "uDpr");
    const uColor = gl.getUniformLocation(prog, "uColor");
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.enableVertexAttribArray(aP);
    gl.vertexAttribPointer(aP, 4, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const phone = matchMedia("(hover: none)").matches;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let field: Field | null = null;

    // цвет текста темы: у холста color: var(--c-ink), браузер отдаёт его как rgb(…)
    const color = () => {
      const [r, g, b] = (getComputedStyle(canvas).color.match(/[\d.]+/g) ?? ["242", "242", "242"]).map(Number);
      gl.uniform3f(uColor, r / 255, g / 255, b / 255);
    };
    color();
    const mo = new MutationObserver(() => {
      color();
      if (!running) draw(0);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      dpr = Math.min(devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uSize, r.width, r.height);
      gl.uniform1f(uDpr, dpr);
      // поле пересобираем, только если площадь заметно изменилась; иначе растягиваем
      if (!field || Math.abs(r.width * r.height - W * H) > W * H * 0.25) field = makeField(r.width, r.height, phone);
      else if (W && H) {
        for (let i = 0; i < field.n; i++) {
          field.hx[i] *= r.width / W;
          field.hy[i] *= r.height / H;
        }
      }
      W = r.width;
      H = r.height;
      if (!running) draw(0);
    };

    // курсор в координатах холста
    const ptr = { x: 0, y: 0, vx: 0, vy: 0, on: false, t: 0 };
    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // палец листает страницу
      const p = local(e);
      const now = performance.now();
      const dt = Math.max(8, now - ptr.t) / 1000;
      if (ptr.on) {
        ptr.vx += ((p.x - ptr.x) / dt - ptr.vx) * 0.35;
        ptr.vy += ((p.y - ptr.y) / dt - ptr.vy) * 0.35;
      }
      ptr.x = p.x;
      ptr.y = p.y;
      ptr.t = now;
      ptr.on = true;
    };
    const onLeave = () => (ptr.on = false);
    // касание: волна от пальца
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch" || !field || reduced.matches) return;
      const p = local(e);
      if (p.y < 0 || p.y > H) return;
      const R = 260;
      for (let i = 0; i < field.n; i++) {
        const dx = field.hx[i] + field.ox[i] - p.x;
        const dy = field.hy[i] + field.oy[i] - p.y;
        const d = Math.hypot(dx, dy);
        if (d > R || d < 0.5) continue;
        const k = (1 - d / R) * 700;
        field.vx[i] += (dx / d) * k;
        field.vy[i] += (dy / d) * k;
        field.glow[i] = Math.max(field.glow[i], 1 - d / R);
      }
      wake();
    };
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    let time = 0;
    let acc = 0;
    const step = (dt: number) => {
      const f = field!;
      time += dt;
      const still = reduced.matches;
      // скорость курсора затухает, если мышь стоит
      ptr.vx *= Math.exp(-dt * 6);
      ptr.vy *= Math.exp(-dt * 6);
      const near = ptr.on && !still;
      for (let i = 0; i < f.n; i++) {
        if (!still) {
          f.hy[i] -= f.speed[i] * dt;
          f.hx[i] += Math.sin(time * 0.4 + f.phase[i]) * f.speed[i] * 0.35 * dt;
          if (f.hy[i] < -8) {
            f.hy[i] = H + 8;
            f.hx[i] = Math.random() * W;
          }
        }
        let gTarget = 0;
        if (near) {
          const dx = f.hx[i] + f.ox[i] - ptr.x;
          const dy = f.hy[i] + f.oy[i] - ptr.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < RADIUS * RADIUS) {
            const d = Math.sqrt(d2) || 1;
            const fall = 1 - d / RADIUS;
            const a = fall * fall * PUSH;
            f.vx[i] += ((dx / d) * a + ptr.vx * fall * 3) * dt;
            f.vy[i] += ((dy / d) * a + ptr.vy * fall * 3) * dt;
            gTarget = fall;
          }
        }
        f.glow[i] += (gTarget - f.glow[i]) * (1 - Math.exp(-dt * (gTarget > f.glow[i] ? 14 : 3)));
      }
      // пружина возврата мелкими шагами
      acc += dt;
      while (acc >= STEP) {
        acc -= STEP;
        for (let i = 0; i < f.n; i++) {
          f.vx[i] += (-K * f.ox[i] - C * f.vx[i]) * STEP;
          f.vy[i] += (-K * f.oy[i] - C * f.vy[i]) * STEP;
          f.ox[i] += f.vx[i] * STEP;
          f.oy[i] += f.vy[i] * STEP;
        }
      }
    };

    const draw = (dt: number) => {
      const f = field;
      if (!f || !W) return;
      if (dt > 0) step(dt);
      const b = f.buf;
      for (let i = 0; i < f.n; i++) {
        const y = f.hy[i] + f.oy[i];
        const tw = reduced.matches ? 1 : 0.75 + 0.25 * Math.sin(time * 1.7 + f.phase[i] * 3);
        // вверху экрана искры гаснут
        const fade = Math.min(1, Math.max(0, y / (H * 0.55)));
        const g = f.glow[i];
        b[i * 4] = f.hx[i] + f.ox[i];
        b[i * 4 + 1] = y;
        b[i * 4 + 2] = f.size[i] * (1 + g * 1.3);
        b[i * 4 + 3] = Math.min(1, f.base[i] * tw * (0.25 + 0.75 * fade) + g);
      }
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bufferData(gl.ARRAY_BUFFER, b, gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.POINTS, 0, f.n);
    };

    // крутим кадры, только пока холст на экране и вкладка открыта
    let running = false;
    let raf = 0;
    let last = 0;
    let visible = false;
    const frame = (t: number) => {
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0);
      last = t;
      draw(dt);
      raf = requestAnimationFrame(frame);
    };
    // покадровая запись видео (?scene=record): кадры шагает скрипт записи
    let record = false;
    try {
      record = sessionStorage.getItem("scene") === "record";
    } catch {}
    const w = window as Window & { __sparksAdvance?: (dt: number) => void };
    if (record) w.__sparksAdvance = (dt) => draw(dt);
    const start = () => {
      if (running || record || !visible || document.hidden || reduced.matches) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    // после касания при «уменьшить движение» и в покое кадры не нужны
    function wake() {
      start();
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    const onReduced = () => {
      if (reduced.matches) {
        stop();
        draw(0);
      } else start();
    };
    reduced.addEventListener("change", onReduced);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    canvas.dataset.on = "";

    return () => {
      stop();
      if (record) delete w.__sparksAdvance;
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      reduced.removeEventListener("change", onReduced);
      document.removeEventListener("visibilitychange", onVis);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
