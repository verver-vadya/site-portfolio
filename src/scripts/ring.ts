// Кольцо работ: медленно крутится само, его можно тянуть мышью и пальцем, крутить
// свайпом трекпада, стрелками и кнопками, Enter открывает работу. Прокрутку страницы
// не перехватываем и от неё не крутимся: вертикальный жест уходит странице.
// Сам ход замирает под курсором, при фокусе с клавиатуры, вне экрана и на 2,5 с после
// любого действия человека. Без анимаций в системе кольцо стоит и не разгоняется,
// повороты кнопками проявляются на месте.

type CaseInfo = { title: string; meta: string; href: string };

const TURN_MS = 560; // поворот кнопкой или стрелкой
const INTRO_MS = 1300; // доворот при загрузке
const AUTO_SPEED = 2.5 / 1000; // сам ход, градусов в миллисекунду: панель за 12 секунд
const AUTO_EASE = 600; // за сколько миллисекунд сам ход плавно набирает скорость или замирает
const AUTO_DELAY = 2500; // пауза после действия человека, потом кольцо снова идёт само
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
  let raf = 0;
  let prev = 0; // время прошлого кадра
  let auto = 0; // текущая скорость самого хода
  let hold = 0; // до этого момента сам ход ждёт
  let hover = false;
  let onScreen = true;
  let tween: { from: number; to: number; start: number; dur: number } | null = null;
  let glide: { v: number; last: number } | null = null; // инерция после броска
  let shown = -1;

  const radius = () => track.offsetWidth / 2 / Math.tan(Math.PI / n);
  const degPerPx = () => 360 / (2 * Math.PI * radius());
  const frontIndex = (a = angle) => Math.round(-a / step);

  function render() {
    track.style.setProperty("--angle", `${angle.toFixed(3)}deg`);
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

  // сам ход идёт, только когда человек ничего не делает с кольцом и видит его
  const autoWanted = () =>
    !reduce.matches && !drag && !hover && onScreen && !document.hidden && !ring.matches(":focus-visible");
  const autoTarget = (now: number) => (!tween && !glide && autoWanted() && now >= hold ? AUTO_SPEED : 0);
  function pause(ms = AUTO_DELAY) {
    hold = performance.now() + ms;
    auto = 0;
    setTimeout(kick, ms + 20);
  }

  function loop(now: number) {
    raf = 0;
    const dt = Math.min(48, Math.max(0, now - prev));
    prev = now;
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
    } else if (!drag) {
      const target = autoTarget(now);
      auto += (target - auto) * (1 - Math.exp(-dt / AUTO_EASE));
      if (target === 0 && auto < AUTO_SPEED * 0.01) auto = 0;
      angle -= auto * dt;
    }
    render();
    if (tween || glide || auto || autoTarget(now)) raf = requestAnimationFrame(loop);
  }
  function kick() {
    if (raf) return;
    prev = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function turnTo(target: number, dur = TURN_MS) {
    glide = null;
    pause();
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
    pause();
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
        kick();
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
      if (!panel) return kick();
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
      pause();
      kick();
    } else snap();
  };
  ring.addEventListener("pointerup", release);
  ring.addEventListener("pointercancel", release);
  // На телефоне палец сначала «держит» панель под собой, и когда кольцо забирает жест себе,
  // панель теряет захват. Отпускаем кольцо, только если захват потеряло оно само.
  ring.addEventListener("lostpointercapture", (e) => {
    if (e.target === ring && drag) release(e);
  });
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
      pause();
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

  // ---- когда сам ход замирает и продолжается ----
  ring.addEventListener("pointerenter", (e) => {
    if (e.pointerType === "mouse") hover = true;
  });
  ring.addEventListener("pointerleave", (e) => {
    if (e.pointerType !== "mouse") return;
    hover = false;
    kick();
  });
  ring.addEventListener("focus", kick);
  ring.addEventListener("blur", kick);
  document.addEventListener("visibilitychange", kick);
  reduce.addEventListener("change", kick);
  new IntersectionObserver(([en]) => {
    onScreen = en.isIntersecting;
    kick();
  }).observe(ring);

  // кольцо пересчитывает радиус само (через CSS), здесь только перерисовать
  addEventListener("resize", render, { passive: true });

  // ---- вход: при приветствии кольцо въезжает и доезжает до первой работы ----
  render();
  if (!reduce.matches && document.documentElement.classList.contains("is-intro")) {
    angle = home + step * 2.5;
    render();
    setTimeout(() => {
      turnTo(home, INTRO_MS);
      pause(INTRO_MS + 1200);
    }, 200);
  } else pause(1500);
}
