"use client";
// Сцена главной: тёмная вода до горизонта, надпись verver стоит на воде и отражается.
// При прокрутке буквы по одной уходят под воду, а из воды поднимается кольцо со скриншотами работ.
// Кольцо крутится пальцем или мышью, панель под курсором выдвигается, по клику панель
// разворачивается в первый экран страницы кейса, и сцена передаёт его настоящей странице.
//
// Кадр рисуется в три прохода: отражение (мир перевёрнут под воду), подводная часть и основной кадр.
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { emit, on, sceneState, type SceneCase } from "@/lib/scene-bus";
import {
  createShared,
  ENTER,
  fadeMaterial,
  panelMaterial,
  skyMaterial,
  waterMaterial,
  tractrixHeight,
  wordMaterial,
  type PanelUniforms,
  type WaterUniforms,
} from "./materials";
import { Ripples } from "./ripples";
import { buildLetters } from "./word";

const FOV = 30;
const TAN = Math.tan(((FOV / 2) * Math.PI) / 180);
const RING_FOV = 72; // объектив у кольца, как в DialKit
const RING_TAN = Math.tan(((RING_FOV / 2) * Math.PI) / 180);
const HP = 2; // высота панели кольца
const LIFT = 0.28; // зазор между водой и низом панели
const WORD_H = 604; // высота надписи в единицах шрифта (с выносом ниже строки)
const WORD_ASC = 588;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

type Panel = {
  caseIndex: number;
  slug: string;
  shot: SceneCase["shots"][number];
  mesh: THREE.Mesh;
  u: PanelUniforms;
  theta: number;
  hover: number;
  large?: THREE.Texture;
  loadingLarge?: boolean;
};

type Props = {
  cases: SceneCase[];
  home: boolean; // открыта главная (на других страницах надписи-ориентира нет)
  navigate: (href: string) => void;
  host: HTMLElement;
  onReady: () => void;
  setBusy: (busy: boolean) => void;
};

function readColors() {
  const cs = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return {
    paper: new THREE.Color(get("--c-paper", "#0b0b0c")),
    ink: new THREE.Color(get("--c-ink", "#f2f2f2")),
    plate: new THREE.Color(get("--c-plate", "#18181a")),
  };
}

export function World({ cases, home, navigate, host, onReady, setBusy }: Props) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  // ---------- объекты сцены (создаются один раз) ----------
  const built = useMemo(() => {
    const shared = createShared();
    const world = new THREE.Group(); // всё, что отражается
    const scene = new THREE.Scene();
    scene.add(world);

    // небо — стена далеко за кольцом; вода до неё и есть горизонт
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(3000, 600), skyMaterial(shared));
    sky.position.set(0, 300, -500);
    world.add(sky);

    const wordGroup = new THREE.Group();
    world.add(wordGroup);
    const wordMat = wordMaterial(shared);
    const letters = buildLetters().map((l) => {
      const mesh = new THREE.Mesh(l.geometry, wordMat);
      wordGroup.add(mesh);
      return { ...l, mesh, y: 0, prevY: 0 };
    });

    // кольцо: по 3 экрана с каждой работы вперемешку, не меньше 18 панелей — широкая лента, как в DialKit
    const order: { caseIndex: number; shotIndex: number }[] = [];
    const perCase = Math.max(1, Math.min(3, ...cases.map((c) => c.shots.length)));
    for (let s = 0; s < perCase; s++) cases.forEach((_, ci) => order.push({ caseIndex: ci, shotIndex: s }));
    while (order.length < 18) order.push(...order.slice(0, Math.min(order.length, 18 - order.length)));
    const n = order.length;
    const step = (Math.PI * 2) / n;
    // экраны почти вплотную, как в DialKit: одна сплошная лента с тонкими швами
    const width = step * 0.985;
    const aspect = cases[0]?.shots[0] ? cases[0].shots[0].width / cases[0].shots[0].height : 1.6;
    const radius = (aspect * HP) / width;

    // появление (см. ENTER в materials.ts): длина пути, на которой середина панели встаёт на свою высоту
    const curve = ENTER.curve * (HP / 2);
    let lo = 0;
    let hi = 40;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (ENTER.floor + tractrixHeight(mid, curve) < LIFT + HP / 2) lo = mid;
      else hi = mid;
    }
    // узкое кольцо из экранов телефона: лента ложится не так далеко
    const enterU = {
      uEnter: { value: 0 },
      uEnterT: { value: lo },
      uStretch: { value: ENTER.stretch * clamp(radius / (4.6 * (HP / 2)), 0.45, 1) },
      uBend: { value: 0 },
      uSqueeze: { value: 1 },
      uWiden: { value: 1 },
    };

    const ring = new THREE.Group();
    world.add(ring);
    const grid = new THREE.PlaneGeometry(1, 1, 48, 1);
    grid.translate(0.5, 0.5, 0); // uv совпадает с позицией 0..1
    const panels: Panel[] = order.map(({ caseIndex, shotIndex }, i) => {
      const c = cases[caseIndex];
      const shot = c.shots[shotIndex % c.shots.length];
      const u: PanelUniforms = {
        uMap: { value: null },
        uMap2: { value: null },
        uMix: { value: 0 },
        uHasMap: { value: 0 },
        uTheta: { value: i * step },
        uWidth: { value: width },
        uRadius: { value: radius },
        uHeight: { value: HP },
        uLift: { value: LIFT },
        uHover: { value: 0 },
        uBlur: { value: 0 },
        uDim: { value: 1 },
        uExpand: { value: 0 },
        uRect: { value: new THREE.Vector4() },
        uDepth: { value: 1 },
        uCover: { value: new THREE.Vector4(1, 1, 0, 0) },
        ...enterU,
      };
      const mesh = new THREE.Mesh(grid, panelMaterial(shared, u));
      mesh.frustumCulled = false;
      ring.add(mesh);
      return { caseIndex, slug: c.slug, shot, mesh, u, theta: i * step, hover: 0 };
    });

    const waterU: WaterUniforms = {
      tReflect: { value: null },
      tRefract: { value: null },
      tSim: { value: null },
      uSimRect: { value: new THREE.Vector4(-9, -14, 18, 26) },
      uSimTexel: { value: new THREE.Vector2(1 / 256, 1 / 256) },
      uSimOn: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uCalm: { value: 0 },
    };
    const water = new THREE.Mesh(new THREE.PlaneGeometry(3000, 600), waterMaterial(shared, waterU));
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0, -240);
    scene.add(water);

    const fade = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), fadeMaterial(shared));
    fade.frustumCulled = false;
    fade.renderOrder = 998;
    fade.visible = false;
    scene.add(fade);

    // отражение со сглаживанием краёв (samples), иначе буквы в воде идут лесенкой
    const rt = (samples = 0) =>
      new THREE.WebGLRenderTarget(2, 2, {
        colorSpace: THREE.SRGBColorSpace,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: true,
        stencilBuffer: false,
        samples,
      });

    return {
      shared,
      scene,
      world,
      sky,
      wordGroup,
      letters,
      ring,
      panels,
      ringInfo: { n, step, width, radius, aspect },
      enterU,
      water,
      waterU,
      fade,
      reflect: rt(4),
      refract: rt(4),
      keepAbove: [new THREE.Plane(new THREE.Vector3(0, 1, 0), 1000)], // в основном кадре не режем ничего
      keepBelow: [new THREE.Plane(new THREE.Vector3(0, -1, 0), 0)],
    };
  }, [cases]);

  // ---------- изменяемое состояние (без перерисовки React) ----------
  const st = useRef({
    ready: false,
    time: 0,
    progress: 0, // прокрутка первого экрана 0..1, сглаженная
    layout: null as null | {
      W: number;
      H: number;
      D: number;
      wpp: number;
      ringDist: number; // от центра кольца до камеры
      ringWpp: number; // сколько мира в пикселе у передней панели кольца
      ringShift: number; // на телефоне камера ниже: лента выше подписи
      camY: number;
      scale: number;
      left: number;
    },
    sim: null as Ripples | null,
    simRect: new THREE.Vector4(),
    sinkDepth: 1.5, // на сколько уходят буквы под воду
    rot: 0,
    vel: 0,
    target: 0,
    mode: "spring" as "spring" | "drag" | "inertia",
    lastInput: -10,
    autoAt: 6,
    rise: 0, // появление кольца 0..1 после сглаживания
    prevRise: 0,
    prevAng: NaN,
    enterT: 0, // время появления 0..1, без сглаживания
    enterWant: false,
    front: -1,
    hovered: -1,
    pointer: { x: 0, y: 0, inside: false, moved: 0, lastWater: null as THREE.Vector3 | null },
    drag: { active: false, id: -1, x: 0, startX: 0, startY: 0, travel: 0, lastT: 0, v: 0, startRot: 0, lock: "" as "" | "x" | "y" },
    expand: null as null | {
      panel: Panel;
      from: string; // адрес, с которого раскрываем: если человек ушёл сам, раскрытие отменяется
      t: number;
      navigated: boolean;
      arrived: boolean; // уже открыта страница этого кейса
      done: boolean;
      waited: number;
      fading: boolean;
      mixAt: number; // когда пришла картинка со страницы кейса (-1 — не нужна или ещё грузится)
      needMix: boolean;
    },
    colors: readColors(),
  });

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const waterPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const tmp = useMemo(() => ({ v: new THREE.Vector3(), target: new THREE.Vector3(), pos: new THREE.Vector3() }), []);

  // ---------- цвета темы ----------
  useEffect(() => {
    const apply = () => {
      const { paper, ink, plate } = readColors();
      const sh = built.shared;
      sh.uPaper.value.copy(paper);
      sh.uInk.value.copy(ink);
      sh.uPlate.value.copy(plate);
      const dark = paper.getHSL({ h: 0, s: 0, l: 0 }).l < 0.5;
      // смешиваем как на экране (sRGB), иначе серый выходит слишком светлым
      const mix = (a: THREE.Color, b: THREE.Color, t: number) => {
        const x = a.clone().convertLinearToSRGB();
        const y = b.clone().convertLinearToSRGB();
        return x.lerp(y, t).convertSRGBToLinear();
      };
      sh.uDeep.value.copy(dark ? mix(paper, new THREE.Color(0, 0, 0), 0.5) : mix(paper, ink, 0.14));
      sh.uGlow.value.copy(mix(paper, ink, dark ? 0.09 : 0.06));
      st.current.colors = { paper, ink, plate };
    };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, [built]);

  // ---------- раскладка: камера, надпись по месту надписи на странице, сетка ряби ----------
  useEffect(() => {
    const W = size.width;
    const H = size.height;
    if (!W || !H) return;
    const aspect = W / H;
    const { aspect: imgAspect } = built.ringInfo;
    // панель занимает 40 % высоты экрана (вертикальные скриншоты с телефона — половину),
    // но по ширине не больше 84 % экрана
    const tall = imgAspect < 1 ? 0.5 : 0.4;
    const D = Math.max(HP / (tall * 2 * TAN), (imgAspect * HP) / (0.84 * 2 * TAN * aspect));
    const wpp = (2 * D * TAN) / H;

    // надпись в HTML (запасной вариант) задаёт место: сцена ставит свою точно на неё
    // Не на главной ориентира нет: оставляем прежнее место надписи, при возврате на главную
    // раскладка пересчитается (home в зависимостях)
    const anchor = document.querySelector<SVGElement>("[data-scene-word]");
    const r = anchor?.getBoundingClientRect();
    const prev = st.current.layout;
    let camY: number, scale: number, left: number;
    if (!(r && r.width) && prev) {
      ({ camY, scale, left } = prev);
    } else {
      const rect = r && r.width
        ? { left: r.left, top: r.top + scrollY, width: r.width, height: r.height }
        : { left: W * 0.11, top: H * 0.58 - W * 0.78 * (WORD_H / 4097), width: W * 0.78, height: W * 0.78 * (WORD_H / 4097) };
      const baseline = rect.top + (rect.height * WORD_ASC) / WORD_H;
      camY = Math.max(0.03, (baseline - H / 2) * wpp);
      scale = (rect.width * wpp) / 4097;
      left = (rect.left - W / 2) * wpp;
    }
    // камера у кольца: всё кольцо по ширине помещается в кадр (формула DialKit)
    const R = built.ringInfo.radius;
    const ringDist = R * Math.sqrt(1 + Math.pow(1 / RING_TAN / Math.max(aspect, 0.85) / 0.9, 2));
    const ringWpp = (2 * (ringDist - R) * RING_TAN) / H;
    // на вертикальном экране подпись закрывает низ: лента встаёт на 40 % высоты вместо середины
    const ringShift = aspect < 1 ? 0.2 * (ringDist - R) * RING_TAN : 0;
    st.current.layout = { W, H, D, wpp, camY, scale, left, ringDist, ringWpp, ringShift };

    built.shared.uReflH.value = Math.max(0.6, WORD_H * scale * 1.5);
    // буквы уходят на глубину, где их уже не видно (см. passChunk в materials.ts)
    st.current.sinkDepth = built.shared.uReflH.value + WORD_H * scale;
    built.letters.forEach((l) => {
      l.mesh.scale.set(scale, scale, 1);
      l.mesh.position.x = left + (l.center - 1) * scale;
    });

    camera.fov = FOV;
    camera.near = 0.1;
    camera.far = 1200;
    camera.updateProjectionMatrix();

    // сетка ряби: от дальнего края кольца до камеры, клетки квадратные
    const x0 = -Math.max(9, D * TAN * aspect * 1.1);
    const sizeX = -2 * x0;
    const z0 = -built.ringInfo.radius * 2 - 3;
    const sizeZ = D + 1 - z0;
    const res = W < 720 ? 160 : 256;
    const resZ = Math.round((res * sizeZ) / sizeX);
    const old = st.current.sim;
    if (!old || old.width !== res || Math.abs(old.height - resZ) > 8) {
      old?.dispose();
      const ok = gl.capabilities.isWebGL2 && (gl.extensions.has("EXT_color_buffer_float") || gl.extensions.has("EXT_color_buffer_half_float"));
      st.current.sim = ok ? new Ripples(res, resZ) : null;
    }
    const sim = st.current.sim;
    st.current.simRect.set(x0, z0, sizeX, sizeZ);
    built.waterU.uSimRect.value.copy(st.current.simRect);
    if (sim) built.waterU.uSimTexel.value.set(1 / sim.width, 1 / sim.height);
    built.waterU.uSimOn.value = sim ? 1 : 0;

    const pr = gl.getPixelRatio();
    built.waterU.uRes.value.set(W * pr, H * pr);
    // отражение чёткое (не меньше 0,75 кадра), то, что под водой, всё равно размыто: хватит половины
    const rs = Math.max(0.75, Math.min(1, 1.5 / pr));
    built.reflect.setSize(Math.round(W * pr * rs), Math.round(H * pr * rs));
    built.refract.setSize(Math.round(W * pr * 0.5), Math.round(H * pr * 0.5));
  }, [size, built, camera, gl, home]);

  // ---------- скриншоты на панели ----------
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const aniso = gl.capabilities.getMaxAnisotropy();
    const cache = new Map<string, THREE.Texture>();
    let cancelled = false;
    const start = () => {
      for (const p of built.panels) {
        const done = (tex: THREE.Texture) => {
          if (cancelled) return;
          p.u.uMap.value = tex;
          p.u.uHasMap.value = 1;
        };
        const hit = cache.get(p.shot.src);
        if (hit) {
          done(hit);
          continue;
        }
        const tex = loader.load(p.shot.src, () => done(tex));
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(8, aniso);
        cache.set(p.shot.src, tex);
      }
    };
    // кольцо видно только после прокрутки: картинки грузим, когда страница уже показана
    const id = window.setTimeout(start, 600);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [built, gl]);

  // крупная версия скриншота для раскрытия на весь экран (та же, что возьмёт страница кейса)
  const loadLarge = (p: Panel) => {
    if (p.large || p.loadingLarge) return;
    p.loadingLarge = true;
    const tex = new THREE.TextureLoader().load(p.shot.large, () => {
      p.large = tex;
      // эту же картинку могут показывать соседние панели: меняем у всех с тем же экраном
      built.panels.forEach((q) => {
        if (q.shot.large === p.shot.large) {
          q.large = tex;
          q.u.uMap.value = tex;
          q.u.uHasMap.value = 1;
        }
      });
    });
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
  };

  // ---------- раскрытие панели в страницу кейса ----------
  const startExpand = (p: Panel) => {
    const s = st.current;
    if (s.expand || !s.layout) return;
    loadLarge(p);
    const { W, H } = s.layout;
    // прямоугольник первого экрана кейса: под шапкой и до низа маленького экрана (100svh)
    const cs = getComputedStyle(document.documentElement);
    const header = parseFloat(cs.getPropertyValue("--header-h")) || 64;
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;top:0;height:100svh;width:0;visibility:hidden";
    document.body.appendChild(probe);
    const svh = probe.getBoundingClientRect().height || H;
    probe.remove();
    const bottom = Math.max(header + 420, svh);
    const depth = 1;
    const halfH = depth * Math.tan((camera.fov * Math.PI) / 360);
    const halfW = halfH * (W / H);
    const toX = (px: number) => (px / W) * 2 * halfW - halfW;
    const toY = (py: number) => halfH - (py / H) * 2 * halfH;
    p.u.uRect.value.set(toX(0), toY(bottom), toX(W), toY(header));
    p.u.uDepth.value = depth;
    // картинка «cover» с привязкой к верху, как object-position: 50% 0% на странице
    const At = W / (bottom - header);
    const Ai = p.shot.width / p.shot.height;
    if (At > Ai) {
      const f = Ai / At;
      p.u.uCover.value.set(1, f, 0, 1 - f);
    } else {
      const f = At / Ai;
      p.u.uCover.value.set(f, 1, (1 - f) / 2, 0);
    }
    const mat = p.mesh.material as THREE.ShaderMaterial;
    mat.transparent = true;
    mat.depthTest = false;
    p.mesh.renderOrder = 999;
    built.fade.visible = true;
    s.expand = { panel: p, from: location.pathname, t: 0, navigated: false, arrived: false, done: false, waited: 0, fading: false, mixAt: -1, needMix: false };
    // На странице кейса первым стоит первый экран работы. Если на панели другой экран,
    // по дороге панель плавно меняет картинку, чтобы передать странице ровно тот же кадр.
    const first = cases[p.caseIndex]?.shots[0];
    if (first && first.large !== p.shot.large) {
      const ex = s.expand;
      ex.needMix = true;
      const ready = built.panels.find((q) => q.shot.large === first.large && q.large)?.large;
      const use = (tex: THREE.Texture) => {
        if (s.expand !== ex) return;
        p.u.uMap2.value = tex;
        ex.mixAt = ex.t;
      };
      if (ready) use(ready);
      else {
        const tex = new THREE.TextureLoader().load(first.large, () => use(tex), undefined, () => (ex.needMix = false));
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      }
    }
    s.hovered = -1;
    emit("cursor", { mode: null });
    document.body.style.cursor = "";
    host.dataset.mode = "front";
    setBusy(true);
  };

  const finishExpand = () => {
    const s = st.current;
    const e = s.expand;
    if (!e) return;
    const p = e.panel;
    p.u.uExpand.value = 0;
    p.u.uMix.value = 0;
    p.u.uMap2.value = null;
    p.hover = 0;
    p.u.uHover.value = 0;
    const mat = p.mesh.material as THREE.ShaderMaterial;
    mat.transparent = false;
    mat.depthTest = true;
    p.mesh.renderOrder = 0;
    (built.fade.material as THREE.ShaderMaterial).uniforms.uFade.value = 0;
    built.fade.visible = false;
    s.expand = null;
    host.dataset.mode = "";
    setBusy(false);
  };

  // ---------- ввод: курсор, касания, перетаскивание кольца, кнопки подписи ----------
  useEffect(() => {
    const s = st.current;
    const interactive = (el: EventTarget | null) =>
      el instanceof Element && !!el.closest("a, button, input, textarea, select, label, summary, [data-scene-ignore]");

    const ringReady = () => s.rise > 0.97 && !s.expand && sceneState.live;
    // Сцена отвечает только там, где её видно: над первым экраном и над кольцом главной.
    // На других страницах и над списком работ (он закрывает сцену) клики — это клики по странице.
    const over = (e: PointerEvent, sel: string) => e.target instanceof Element && !!e.target.closest(sel);
    const onWater = (e: PointerEvent) => over(e, "[data-scene-hero], [data-scene-stage]");
    const onRing = (e: PointerEvent) => over(e, "[data-scene-stage]");
    const unhover = () => {
      if (s.hovered < 0) return;
      s.hovered = -1;
      emit("cursor", { mode: null });
      document.body.style.cursor = "";
    };

    const setNdc = (e: PointerEvent) => {
      const L = s.layout;
      if (!L) return false;
      ndc.set((e.clientX / L.W) * 2 - 1, -(e.clientY / L.H) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      return true;
    };

    // какая панель под лучом (пересечение с цилиндром кольца)
    const pickPanel = () => {
      const { radius, width } = built.ringInfo;
      const o = raycaster.ray.origin.clone().sub(built.ring.position);
      const d = raycaster.ray.direction;
      const a = d.x * d.x + d.z * d.z;
      const b = 2 * (o.x * d.x + o.z * d.z);
      const c = o.x * o.x + o.z * o.z - (radius + 0.1) * (radius + 0.1);
      const disc = b * b - 4 * a * c;
      if (disc < 0 || a < 1e-6) return -1;
      const t = (-b - Math.sqrt(disc)) / (2 * a);
      if (t < 0) return -1;
      const y = o.y + t * d.y;
      if (y < LIFT - 0.05 || y > LIFT + HP + 0.05) return -1;
      const ang = Math.atan2(o.x + t * d.x, o.z + t * d.z);
      let best = -1;
      built.panels.forEach((p, i) => {
        if (Math.abs(wrap(ang - (p.theta + s.rot))) < width / 2) best = i;
      });
      return best;
    };

    const waterHit = () => raycaster.ray.intersectPlane(waterPlane, tmp.v);

    const dropAt = (x: number, z: number, radius: number, strength: number) => {
      const sim = s.sim;
      if (!sim) return;
      const r = s.simRect;
      sim.drop((x - r.x) / r.z, (z - r.y) / r.w, radius / r.z, strength);
    };

    const onMove = (e: PointerEvent) => {
      if (s.drag.active && e.pointerId !== s.drag.id) return;
      if (!s.drag.active && !onWater(e)) {
        s.pointer.lastWater = null;
        unhover();
        return;
      }
      if (!setNdc(e)) return;
      s.pointer.inside = true;
      if (s.drag.active) {
        // палец: сначала понимаем, куда он ведёт. Вбок — крутим кольцо, вверх-вниз — это прокрутка страницы
        if (!lockDrag(e.clientX, e.clientY)) return;
        const L = s.layout!;
        const dx = e.clientX - s.drag.x;
        s.drag.x = e.clientX;
        s.drag.travel += Math.abs(dx);
        const dTheta = (dx * L.ringWpp * 1.05) / built.ringInfo.radius;
        s.rot += dTheta;
        s.target = s.rot;
        const now = s.time * 1000; // время сцены, а не часов: так же работает и покадровая запись
        const dt = Math.max(1, now - s.drag.lastT) / 1000;
        s.drag.v = s.drag.v * 0.6 + (dTheta / dt) * 0.4;
        s.drag.lastT = now;
        s.lastInput = s.time;
        return;
      }
      // рябь от курсора: капля тем сильнее, чем быстрее движение
      const hit = waterHit();
      if (hit && !s.expand) {
        const last = s.pointer.lastWater;
        const dist = last ? last.distanceTo(hit) : 0;
        if (!last || dist > 0.06) {
          dropAt(hit.x, hit.z, 0.18, Math.min(0.004 + dist * 0.01, 0.016));
          s.pointer.lastWater = hit.clone();
        }
      }
      if (!onRing(e)) unhover();
      else if (ringReady() && e.pointerType === "mouse") {
        const i = interactive(e.target) ? -1 : pickPanel();
        if (i !== s.hovered) {
          s.hovered = i;
          emit("cursor", { mode: i >= 0 ? "open" : null });
          document.body.style.cursor = i >= 0 ? "pointer" : "";
          if (i >= 0) loadLarge(built.panels[i]);
        }
      }
    };

    const onDown = (e: PointerEvent) => {
      // второй палец: это не перетаскивание кольца (например, увеличение страницы)
      if (s.drag.active && e.pointerId !== s.drag.id) return onCancel();
      if (e.button !== 0 || interactive(e.target) || !onWater(e) || !setNdc(e)) return;
      if (ringReady() && onRing(e)) {
        const i = pickPanel();
        const L = s.layout!;
        // за кольцо можно взяться на его высоте; ниже — это вода
        if (i >= 0 || Math.abs(e.clientY - L.H * 0.45) < L.H * 0.3) {
          s.drag = {
            active: true,
            id: e.pointerId,
            x: e.clientX,
            startX: e.clientX,
            startY: e.clientY,
            travel: 0,
            lastT: s.time * 1000,
            v: 0,
            startRot: s.rot,
            lock: e.pointerType === "mouse" ? "x" : "",
          };
          s.mode = "drag";
          s.vel = 0;
          s.lastInput = s.time;
        }
      }
      // касание воды пускает круги
      const hit = waterHit();
      if (hit && !s.expand) dropAt(hit.x, hit.z, e.pointerType === "mouse" ? 0.3 : 0.4, 0.03);
    };

    const onUp = (e: PointerEvent) => {
      if (!s.drag.active || e.pointerId !== s.drag.id) return;
      s.drag.active = false;
      const tap = s.drag.travel < 6 && Math.abs(e.clientY - s.drag.startY) < 6;
      if (tap && setNdc(e) && ringReady()) {
        const i = pickPanel();
        if (i >= 0) {
          startExpand(built.panels[i]);
          return;
        }
      }
      settle(s.drag.v, e.clientX - s.drag.startX);
    };

    // Куда встать после перетаскивания. Раньше кольцо докатывалось по инерции и, если бросок был
    // коротким, возвращалось к той же работе: казалось, что оно еле крутится. Теперь заметный
    // свайп всегда приводит хотя бы к соседней работе, сильный бросок — на несколько дальше.
    const settle = (v: number, swipe: number) => {
      const { step } = built.ringInfo;
      const from = Math.round(s.drag.startRot / step);
      let to = Math.round((s.rot + clamp(v, -12, 12) * 0.28) / step);
      if (to === from && Math.abs(swipe) > 24) to = from + Math.sign(swipe);
      s.mode = "spring";
      s.target = to * step;
      s.vel = clamp(v, -8, 8);
      s.lastInput = s.time;
    };

    // lock: "x" — ведём кольцо, "y" — человек листает страницу, кольцо отпускаем
    const lockDrag = (x: number, y: number) => {
      const d = s.drag;
      if (d.lock === "x") return true;
      if (d.lock === "y") return false;
      const dx = Math.abs(x - d.startX);
      const dy = Math.abs(y - d.startY);
      if (dx + dy < 8) return false;
      d.lock = dx > dy * 0.8 ? "x" : "y";
      if (d.lock === "y") {
        d.active = false;
        s.mode = "spring";
        s.target = Math.round(s.rot / built.ringInfo.step) * built.ringInfo.step;
        return false;
      }
      d.x = x; // без рывка на первые пиксели
      return true;
    };

    // Если палец пошёл вбок, отменяем прокрутку страницы и выделение текста, иначе браузер
    // забирает жест себе посреди движения и кольцо застревает
    const onTouchMove = (e: TouchEvent) => {
      if (!s.drag.active || e.touches.length !== 1) return;
      const t = e.touches[0];
      if (lockDrag(t.clientX, t.clientY) && e.cancelable) e.preventDefault();
    };

    function onCancel(e?: PointerEvent) {
      if (!s.drag.active || (e && e.pointerId !== s.drag.id)) return;
      s.drag.active = false;
      // уже вели кольцо: доводим до работы, к которой тянули, а не отбрасываем назад
      if (s.drag.lock === "x" && e) return settle(s.drag.v, s.drag.x - s.drag.startX);
      s.vel = 0;
      s.mode = "spring";
      s.target = Math.round(s.rot / built.ringInfo.step) * built.ringInfo.step;
    }

    const onLeave = () => {
      s.pointer.inside = false;
      s.pointer.lastWater = null;
      unhover();
    };

    const offStep = on("ring-step", ({ dir }) => {
      const { step } = built.ringInfo;
      s.mode = "spring";
      s.target = Math.round(s.rot / step) * step - dir * step;
      s.lastInput = s.time;
    });

    // «Открыть» в подписи: раскрываем ближайшую к зрителю панель этой работы
    const offOpen = on("ring-open", ({ slug }) => {
      let best: Panel | null = null;
      let bestA = Infinity;
      for (const p of built.panels) {
        const a = Math.abs(wrap(p.theta + s.rot));
        if (p.slug === slug && a < bestA) {
          best = p;
          bestA = a;
        }
      }
      if (best) startExpand(best);
      else navigate(`/cases/${slug}/`);
    });

    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerdown", onDown, { passive: true });
    addEventListener("pointerup", onUp, { passive: true });
    addEventListener("pointercancel", onCancel, { passive: true });
    addEventListener("touchmove", onTouchMove, { passive: false });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerdown", onDown);
      removeEventListener("pointerup", onUp);
      removeEventListener("pointercancel", onCancel);
      removeEventListener("touchmove", onTouchMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      offStep();
      offOpen();
      document.body.style.cursor = "";
    };
    // startExpand и loadLarge читают только изменяемое состояние
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [built, camera, raycaster, ndc, waterPlane, tmp, navigate]);

  // ---------- каждый кадр ----------
  useFrame((_, rawDt) => {
    const s = st.current;
    const L = s.layout;
    if (!L) return;
    const dt = Math.min(rawDt, 1 / 20);
    s.time += dt;
    const { step, n } = built.ringInfo;

    // прокрутка первого экрана → 0..1
    const hero = document.querySelector<HTMLElement>("[data-scene-hero]");
    if (hero && !s.expand) {
      const raw = clamp(scrollY / (hero.offsetHeight * 0.85));
      s.progress += (raw - s.progress) * (1 - Math.exp(-dt * 9));
      if (Math.abs(raw - s.progress) < 1e-4) s.progress = raw;
    }
    const p = s.progress;

    // буквы: покачиваются на воде и по очереди тонут
    const wordH = WORD_H * L.scale;
    built.letters.forEach((l, i) => {
      const t = clamp((p - 0.035 * i) / 0.4);
      const sink = smooth(t) * s.sinkDepth;
      const bob = Math.sin(s.time * 0.9 + i * 1.3) * wordH * 0.012 * (1 - t);
      l.prevY = l.y;
      l.y = bob - sink;
      l.mesh.position.y = l.y;
      l.mesh.rotation.z = (i % 2 ? 1 : -1) * 0.05 * smooth(t);
      // где буква пересекает воду, от неё расходятся круги
      const speed = Math.abs(l.y - l.prevY) / dt;
      if (l.y > -wordH * 1.05 && l.y < -wordH * 0.03 && speed > 0.05 && s.sim) {
        const half = (l.width * L.scale) / 2;
        const x = l.mesh.position.x + (Math.random() * 2 - 1) * half * 0.8;
        const r = s.simRect;
        s.sim.drop((x - r.x) / r.z, (0 - r.y) / r.w, 0.14 / r.z, Math.min(speed * 0.008, 0.012));
      }
    });
    built.wordGroup.visible = p < 0.999;

    // Кольцо появляется, когда буквы почти ушли под воду: лента всплывает, лежит на воде широким
    // кругом и встаёт стеной (как в DialKit, шейдер в materials.ts). Идёт по времени, а не за
    // прокруткой: 2,9 секунды, быстро в начале и долго, мягко в конце. Назад к надписи — ложится
    // обратно быстрее.
    if (p > 0.55) s.enterWant = true;
    else if (p < 0.35) s.enterWant = false;
    s.enterT = clamp(s.enterT + (s.enterWant ? dt / 2.9 : -dt / 1.1));
    s.prevRise = s.rise;
    s.rise = 1 - Math.pow(1 - s.enterT, 5.65);
    built.enterU.uEnter.value = s.rise;
    built.ring.position.set(0, 0, -built.ringInfo.radius);
    built.ring.visible = s.rise > 0.001;
    // круги на воде там, где лента сходит с воды на подъём
    const riseSpeed = Math.abs(s.rise - s.prevRise) / dt;
    if (riseSpeed > 0.01 && s.rise < 0.95 && s.sim) {
      const { radius, width } = built.ringInfo;
      const h = HP / 2;
      const travel = -h - ENTER.approach * h + (built.enterU.uEnterT.value + h + ENTER.approach * h) * s.rise;
      const foot = travel - h <= 0 ? ENTER.curve * h * built.enterU.uStretch.value : 0;
      const settle = smooth(clamp((s.rise - 0.86) / 0.14));
      const rr = radius + foot * (1 - settle);
      for (let k = 0; k < 3; k++) {
        const pnl = built.panels[Math.floor(Math.random() * n)];
        const a = pnl.theta + s.rot + (Math.random() - 0.5) * width;
        if (Math.cos(a) < -0.3) continue;
        const x = rr * Math.sin(a);
        const z = rr * Math.cos(a) + built.ring.position.z;
        const r = s.simRect;
        s.sim.drop((x - r.x) / r.z, (z - r.y) / r.w, 0.2 / r.z, Math.min(riseSpeed * 0.01, 0.014));
      }
    }

    // вращение: перетаскивание, инерция, пружина к ближайшей панели, сам шагает раз в несколько секунд
    if (s.mode === "inertia") {
      s.vel *= Math.exp(-dt * 3.2);
      s.rot += s.vel * dt;
      if (Math.abs(s.vel) < 0.5) {
        s.mode = "spring";
        s.target = Math.round(s.rot / step) * step;
      }
    } else if (s.mode === "spring") {
      const k = 26;
      const acc = k * (s.target - s.rot) - 2 * Math.sqrt(k) * s.vel;
      s.vel += acc * dt;
      s.rot += s.vel * dt;
      // само не крутится, пока на кольце курсор или фокус с клавиатуры (кнопки подписи)
      const focused = !!document.activeElement?.closest("[data-scene-stage]");
      const idle = s.time - s.lastInput > 7 && s.hovered < 0 && !focused && !s.expand && s.rise > 0.97;
      if (idle && s.time > s.autoAt) {
        s.target = Math.round(s.rot / step) * step - step;
        s.autoAt = s.time + 5;
      }
      if (!idle) s.autoAt = Math.max(s.autoAt, s.time + 2);
    } else {
      s.vel = s.drag.v;
    }
    // пока поднимается, кольцо доворачивается и замедляется: подъём по спирали
    const spin = 0.9 * (1 - s.enterT) * (1 - s.enterT);
    // скорость вращения (рад/с) вместе с доворотом при появлении
    const ang = s.rot + spin;
    const w = Number.isNaN(s.prevAng) ? 0 : Math.abs(ang - s.prevAng) / dt;
    s.prevAng = ang;
    const blur = Math.min(w * 0.0016, 0.011);
    // лента как ткань (как в DialKit): чем быстрее крутится, тем сильнее прогибается, сжимается
    // по высоте и растягивается вширь; при появлении ещё и выгнута, пока не встанет
    {
      const k = clamp((w - 0.3) / 1.7);
      const kk = k * k * (3 - 2 * k);
      const settle = smooth(clamp((s.rise - 0.86) / 0.14));
      const bend = 0.39 * kk * kk + 0.3 * (1 - settle) * Math.min(1, s.rise * 4);
      const u = built.enterU;
      const attack = 1 - Math.exp(-dt * (bend > u.uBend.value ? 4 : 2.5));
      u.uBend.value += (bend - u.uBend.value) * attack;
      u.uSqueeze.value += (1 - 0.15 * kk - u.uSqueeze.value) * attack;
      u.uWiden.value += (1 + 0.12 * kk - u.uWiden.value) * attack;
    }

    built.panels.forEach((pnl, i) => {
      pnl.u.uTheta.value = pnl.theta + s.rot + spin;
      const want = i === s.hovered && !s.drag.active ? 1 : 0;
      pnl.hover += (want - pnl.hover) * (1 - Math.exp(-dt * 7));
      if (!s.expand || s.expand.panel !== pnl) {
        pnl.u.uHover.value = pnl.hover * 0.24;
        pnl.u.uBlur.value = blur;
      }
    });

    // какая работа спереди
    const front = ((Math.round(-(s.rot + spin) / step) % n) + n) % n;
    if (front !== s.front && s.rise > 0.5) {
      s.front = front;
      // запоминаем и в общем состоянии: подпись на главной создаётся заново при каждом возвращении
      sceneState.active = built.panels[front].caseIndex;
      emit("ring-active", { index: sceneState.active });
    }

    // камера: от низкого взгляда над водой с узким объективом к кольцу, как в DialKit: прямо на
    // ленту на уровне её середины, широким объективом, чтобы экраны выглядели выгнутыми
    const e = smooth(clamp(p / 0.92));
    const R = built.ringInfo.radius;
    const mid = LIFT + HP / 2;
    const ringPos = tmp.pos.set(0, mid - L.ringShift, -R + L.ringDist);
    const heroPos = tmp.v.set(0, L.camY, L.D);
    camera.position.lerpVectors(heroPos, ringPos, e);
    const heroTarget = new THREE.Vector3(0, L.camY, 0);
    const ringTarget = new THREE.Vector3(0, mid - L.ringShift, -R);
    tmp.target.lerpVectors(heroTarget, ringTarget, e);
    camera.lookAt(tmp.target);
    const fov = FOV + (RING_FOV - FOV) * e;
    if (Math.abs(camera.fov - fov) > 1e-4) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();

    // раскрытие панели
    const ex = s.expand;
    const casePath = ex && `/cases/${ex.panel.slug}/`;
    if (ex && !ex.navigated && location.pathname !== ex.from) {
      // пока панель раскрывалась, человек сам ушёл по ссылке в шапке: не перебиваем его переход
      finishExpand();
    } else if (ex && ex.arrived && !ex.done && !location.pathname.endsWith(casePath!)) {
      // страница кейса открылась, но человек сразу нажал «Назад»: убираем панель
      ex.done = true;
      host.dataset.mode = "fade";
      window.setTimeout(finishExpand, 380);
    } else if (ex) {
      if (ex.navigated && location.pathname.endsWith(casePath!)) ex.arrived = true;
      ex.t += dt;
      const k = clamp(ex.t / 0.95);
      const eased = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      ex.panel.u.uExpand.value = eased;
      ex.panel.u.uHover.value = ex.panel.hover * 0.24 * (1 - eased);
      ex.panel.u.uBlur.value = 0;
      (built.fade.material as THREE.ShaderMaterial).uniforms.uFade.value = smooth(clamp(ex.t / 0.6));
      // смена картинки: не раньше середины раскрытия, за 0,45 секунды
      if (ex.mixAt >= 0) ex.panel.u.uMix.value = smooth(clamp((ex.t - Math.max(ex.mixAt, 0.3)) / 0.45));
      const mixed = !ex.needMix || ex.panel.u.uMix.value >= 1;
      if (!ex.navigated && ex.t > 0.35) {
        ex.navigated = true;
        navigate(casePath!);
      }
      if (k >= 1 && !ex.done) {
        ex.waited += dt;
        const img = document.querySelector<HTMLImageElement>(`[data-case-hero="${ex.panel.slug}"] img`);
        const ok = img && img.complete && img.naturalWidth > 0 && mixed;
        if (ok || ex.waited > 2.5) {
          ex.done = true;
          const go = () => {
            host.dataset.mode = "fade";
            window.setTimeout(finishExpand, 380);
          };
          if (img && ok) img.decode().then(go, go);
          else go();
        }
      }
    }

    // рябь
    if (s.sim) {
      const steps = Math.max(1, Math.min(3, Math.round(dt * 60)));
      s.sim.step(gl, steps);
      built.waterU.tSim.value = s.sim.texture;
    }
    built.waterU.uTime.value = s.time;

    // ---------- три прохода ----------
    const sh = built.shared;
    const prevClip = gl.clippingPlanes;

    // 1. отражение: мир перевёрнут под воду, остаётся только то, что было над водой
    built.water.visible = false;
    built.fade.visible = false;
    built.world.scale.y = -1;
    built.world.updateMatrixWorld();
    sh.uPass.value = 1;
    gl.clippingPlanes = built.keepBelow;
    gl.setClearColor(s.colors.paper);
    gl.setRenderTarget(built.reflect);
    gl.render(built.scene, camera);

    // 2. под водой: только то, что ниже поверхности, без неба
    built.world.scale.y = 1;
    built.world.updateMatrixWorld();
    sh.uPass.value = 2;
    built.sky.visible = false;
    gl.setClearColor(sh.uDeep.value);
    gl.setRenderTarget(built.refract);
    gl.render(built.scene, camera);
    built.sky.visible = true;

    // 3. основной кадр
    sh.uPass.value = 0;
    gl.clippingPlanes = built.keepAbove;
    built.water.visible = true;
    built.fade.visible = !!s.expand;
    built.waterU.tReflect.value = built.reflect.texture;
    built.waterU.tRefract.value = built.refract.texture;
    gl.setClearColor(s.colors.paper);
    gl.setRenderTarget(null);
    gl.render(built.scene, camera);
    gl.clippingPlanes = prevClip;

    if (!s.ready) {
      s.ready = true;
      sceneState.live = true;
      onReady();
    }
  }, 1);

  useEffect(
    () => () => {
      sceneState.live = false;
      st.current.sim?.dispose();
      st.current.sim = null;
      built.reflect.dispose();
      built.refract.dispose();
      // при повороте телефона сцена собирается заново: старые сетки, шейдеры и картинки освобождаем
      built.scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material as THREE.ShaderMaterial;
          m.uniforms?.uMap?.value?.dispose?.();
          m.dispose();
        }
      });
      built.panels.forEach((pnl) => pnl.large?.dispose());
    },
    [built]
  );

  return null;
}
