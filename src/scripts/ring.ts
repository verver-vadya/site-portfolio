// Кольцо работ: перетаскивание мышью и пальцем, свайп трекпадом, стрелки, Enter.
// Обычную прокрутку страницы не перехватываем: вертикальный жест уходит странице,
// а при прокрутке кольцо лишь слегка доворачивается. Без анимаций в системе кольцо
// не крутится само и не разгоняется, повороты кнопками проявляются на месте.

type CaseInfo = { title: string; meta: string; href: string };

const TURN_MS = 560; // поворот кнопкой или стрелкой
const INTRO_MS = 1300; // доворот при загрузке
const SCROLL_TURN = 0.012; // градусов на пиксель прокрутки
const CLICK_SLOP = 6; // меньше этого сдвига — это нажатие, а не перетаскивание

// Кривая поворота: мягкий старт, долгое торможение, как --ease-turn: cubic-bezier(0.35, 0, 0.15, 1)
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const at = (a1: number, a2: number, t: number) => 3 * a1 * (1 - t) ** 2 * t + 3 * a2 * (1 - t) * t * t + t ** 3;
  const slope = (a1: number, a2: number, t: number) => 3 * a1 * (1 - t) ** 2 + 6 * (a2 - a1) * (1 - t) * t + 3 * (1 - a2) * t * t;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 6; i++) {
      const s = slope(x1, x2, t);
      if (Math.abs(s) < 1e-6) break;
      t -= (at(x1, x2, t) - x) / s;
    }
    return at(y1, y2, Math.min(1, Math.max(0, t)));
  };
}
const turnEase = bezier(0.35, 0, 0.15, 1);
const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : turnEase(t));

export function initRing(ring: HTMLElement) {
  const scope = ring.closest<HTMLElement>("[data-ring-scope]") ?? document.body;
  const track = ring.querySelector<HTMLElement>("[data-track]")!;
  const panels = [...ring.querySelectorAll<HTMLElement>(".ring__panel")];
  const cases: CaseInfo[] = JSON.parse(ring.dataset.cases || "[]");
  const n = panels.length;
  const step = 360 / n;
  const caseOf = (i: number) => Number(panels[((i % n) + n) % n].dataset.case);

  const $ = <T extends HTMLElement>(sel: string) => scope.querySelector<T>(sel);
  const elCount = $("[data-ring-count]");
  const elTitle = $<HTMLAnchorElement>("[data-ring-title]");
  const elMeta = $("[data-ring-meta]");
  const elOpen = $<HTMLAnchorElement>("[data-ring-open]");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");

  let angle = parseFloat(track.style.getPropertyValue("--angle")) || 0; // поворот кольца, градусы
  const home = angle;
  let scrollTurn = 0; // доворот от прокрутки страницы (только для вида)
  let raf = 0;
  let tween: { from: number; to: number; start: number; dur: number } | null = null;
  let glide: { v: number; last: number } | null = null; // инерция после броска
  let shown = -1;

  const radius = () => track.offsetWidth / 2 / Math.tan(Math.PI / n);
  const degPerPx = () => 360 / (2 * Math.PI * radius());
  const frontIndex = (a = angle) => Math.round(-a / step);

  function render() {
    track.style.setProperty("--angle", `${(angle + scrollTurn).toFixed(3)}deg`);
    const ci = caseOf(frontIndex());
    if (ci !== shown) {
      shown = ci;
      const c = cases[ci];
      if (!c) return;
      if (elCount) elCount.textContent = `${String(ci + 1).padStart(2, "0")} / ${String(cases.length).padStart(2, "0")}`;
      if (elTitle) {
        elTitle.textContent = c.title;
        elTitle.href = c.href;
      }
      if (elMeta) elMeta.textContent = c.meta;
      if (elOpen) elOpen.href = c.href;
    }
  }

  function loop(now: number) {
    raf = 0;
    if (tween) {
      const t = (now - tween.start) / tween.dur;
      angle = tween.from + (tween.to - tween.from) * smooth(t);
      if (t >= 1) {
        angle = tween.to;
        tween = null;
      }
    } else if (glide) {
      const dt = Math.min(48, now - glide.last);
      glide.last = now;
      angle += glide.v * dt;
      glide.v *= Math.pow(0.0045, dt / 1000); // трение
      if (Math.abs(glide.v) < 0.02) {
        glide = null;
        snap(TURN_MS * 0.8);
      }
    }
    render();
    if (tween || glide) raf = requestAnimationFrame(loop);
  }
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(loop);
  };

  function turnTo(target: number, dur = TURN_MS) {
    glide = null;
    if (reduce.matches || dur <= 0) {
      tween = null;
      angle = target;
      render();
      if (reduce.matches) track.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
      return;
    }
    tween = { from: angle, to: target, start: performance.now(), dur };
    kick();
  }
  const snap = (dur = TURN_MS) => turnTo(-frontIndex() * step, dur);

  // к соседней работе: ищем ближайшую панель другого кейса и встаём на середину его экранов
  function toCase(dir: 1 | -1) {
    const from = frontIndex(tween ? tween.to : angle);
    const cur = caseOf(from);
    let i = from;
    do i += dir;
    while (caseOf(i) === cur && Math.abs(i - from) < n);
    let j = i;
    while (caseOf(j + dir) === caseOf(i) && Math.abs(j - i) < n) j += dir;
    const mid = Math.round((i + j) / 2);
    turnTo(-mid * step);
  }

  // ---- перетаскивание ----
  let drag: { id: number; x: number; y: number; last: number; lastT: number; moved: number; v: number; horizontal: boolean | null } | null = null;

  ring.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    tween = null;
    glide = null;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, last: e.clientX, lastT: e.timeStamp, moved: 0, v: 0, horizontal: e.pointerType === "mouse" ? true : null };
  });
  ring.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.last;
    drag.moved = Math.max(drag.moved, Math.abs(e.clientX - drag.x), Math.abs(e.clientY - drag.y));
    if (drag.horizontal === null) {
      if (drag.moved < CLICK_SLOP) return;
      // на телефоне вертикальный жест остаётся прокруткой страницы
      drag.horizontal = Math.abs(e.clientX - drag.x) > Math.abs(e.clientY - drag.y);
      if (!drag.horizontal) {
        drag = null;
        return;
      }
    }
    if (drag.moved >= CLICK_SLOP && !ring.classList.contains("is-dragging")) {
      ring.classList.add("is-dragging");
      ring.setPointerCapture(e.pointerId);
    }
    const dt = Math.max(1, e.timeStamp - drag.lastT);
    const dAngle = dx * degPerPx();
    angle += dAngle;
    drag.v = drag.v * 0.6 + (dAngle / dt) * 0.4;
    drag.last = e.clientX;
    drag.lastT = e.timeStamp;
    render();
  });
  const release = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    ring.classList.remove("is-dragging");
    if (d.moved < CLICK_SLOP && e.type === "pointerup") {
      // нажатие: по передней панели открываем работу, по боковой — поворачиваем к ней
      const panel = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest<HTMLElement>(".ring__panel");
      if (!panel) return;
      const i = Number(panel.dataset.i);
      const k = frontIndex();
      let nearest = i;
      while (nearest - k > n / 2) nearest -= n;
      while (k - nearest > n / 2) nearest += n;
      if (nearest === k) location.href = cases[caseOf(i)].href;
      else turnTo(-nearest * step);
      return;
    }
    const idle = e.timeStamp - d.lastT > 80;
    if (!reduce.matches && !idle && Math.abs(d.v) > 0.03) {
      glide = { v: Math.max(-1.2, Math.min(1.2, d.v)), last: performance.now() };
      kick();
    } else snap();
  };
  ring.addEventListener("pointerup", release);
  ring.addEventListener("pointercancel", release);
  ring.addEventListener("lostpointercapture", (e) => drag && release(e));
  ring.addEventListener("dragstart", (e) => e.preventDefault());

  // ---- трекпад: горизонтальный свайп крутит кольцо, вертикальный листает страницу ----
  let wheelTimer = 0;
  ring.addEventListener(
    "wheel",
    (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      tween = null;
      glide = null;
      angle -= e.deltaX * degPerPx();
      render();
      clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => snap(), 140);
    },
    { passive: false }
  );

  // ---- клавиатура и кнопки ----
  ring.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") toCase(1);
    else if (e.key === "ArrowLeft") toCase(-1);
    else if (e.key === "Enter") location.href = cases[caseOf(frontIndex())].href;
    else return;
    e.preventDefault();
  });
  $("[data-ring-next]")?.addEventListener("click", () => toCase(1));
  $("[data-ring-prev]")?.addEventListener("click", () => toCase(-1));

  // ---- лёгкий доворот при прокрутке страницы ----
  let ticking = false;
  addEventListener(
    "scroll",
    () => {
      if (reduce.matches || ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = Math.min(scrollY, innerHeight * 1.5);
        scrollTurn = -y * SCROLL_TURN * (360 / n / 30);
        render();
      });
    },
    { passive: true }
  );

  // кольцо пересчитывает радиус само (через CSS), здесь только перерисовать
  addEventListener("resize", render, { passive: true });

  // ---- вход: кольцо доезжает до первой работы ----
  render();
  if (!reduce.matches) {
    angle = home + step * 2.5;
    render();
    requestAnimationFrame(() => turnTo(home, INTRO_MS));
  }
}
