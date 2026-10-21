"use client";
// Сцена кольца на главной: пока кольцо стоит, внизу подпись работы, которая сейчас спереди,
// кнопки ← → и «Открыть». Само кольцо рисует 3D-сцена; без неё этот блок скрыт и ниже идёт
// обычный список работ.
// На вертикальном экране (телефон) кольцо собрано здесь же вёрсткой: скриншоты с телефона стоят
// по дуге, а листает их обычная прокрутка браузера вбок с доводкой к карточке (Arc ниже).
import Link from "next/link";
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Stepper } from "pasito";
import "pasito/styles.css";
import { dict } from "@/lib/dict";
import { href, type Lang } from "@/lib/i18n";
import type { Img } from "@/lib/images";
import { emit, on, sceneState } from "@/lib/scene-bus";
import { tune } from "@/lib/tune";
import { Shot } from "@/components/Shot";
import s from "./Stage.module.css";

export type StageCase = { slug: string; title: string; meta: string; tagline?: string; phone: Img };

// то же условие, что у сцены (Scene.tsx): ширина меньше 0,8 высоты
const PORTRAIT = "(max-aspect-ratio: 4/5)";

export function Stage({ cases, lang }: { cases: StageCase[]; lang: Lang }) {
  const t = dict[lang].stage;
  const [active, setActive] = useState(() => sceneState.active);
  const [shown, setShown] = useState(false);
  // подпись зачитывается вслух только после нажатия ← →, а не при каждом шаге кольца само по себе
  const [announce, setAnnounce] = useState(false);
  const [phone, setPhone] = useState(false);
  const phoneRef = useRef(false);
  const arc = useRef<ArcApi>(null);
  const step = (dir: 1 | -1) => {
    setAnnounce(true);
    if (phoneRef.current) arc.current?.go(active + dir);
    else emit("ring-step", { dir });
  };
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const m = matchMedia(PORTRAIT);
    const check = () => {
      phoneRef.current = m.matches;
      setPhone(m.matches);
    };
    check();
    m.addEventListener("change", check);
    return () => m.removeEventListener("change", check);
  }, []);

  const onArc = useCallback((i: number) => {
    sceneState.active = i;
    setActive(i);
  }, []);

  useEffect(() => on("ring-active", ({ index }) => setActive(index)), []);

  // точки работ (Pasito): активная заполняется до следующего шага, пока кольцо крутится само
  const [auto, setAuto] = useState<{ wait: number; n: number } | null>(null);
  useEffect(() => on("ring-auto", ({ wait }) => setAuto((a) => (wait === null ? null : { wait, n: (a?.n ?? 0) + 1 }))), []);
  const dots = useRef<HTMLDivElement>(null);
  // у Pasito подписи точек по-английски («Step 1»): ставим свои
  useEffect(() => {
    dots.current?.querySelector("[aria-label]")?.setAttribute("aria-label", t.label);
    dots.current?.querySelectorAll<HTMLElement>(".pasito-step").forEach((el, i) => {
      if (cases[i]) el.setAttribute("aria-label", t.work(i + 1, cases[i].title));
    });
  });

  // подпись видна, пока кольцо стоит на экране; после первого подъёма кольцо ездит вместе с блоком,
  // и подпись с кнопками тоже не исчезает, а уезжает вместе с ним
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // на телефоне дуга едет вместе с блоком: появляется, как только блок заметно выехал на экран
      const from = phoneRef.current ? 0.7 : sceneState.risen ? 1 : 0.25;
      setShown(r.top < innerHeight * from && r.bottom > innerHeight * (phoneRef.current ? 0.3 : 0.6));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const c = cases[active] ?? cases[0];
  if (!c) return null;
  const pad = (n: number) => String(n).padStart(2, "0");

  const open = (e: React.MouseEvent) => {
    if (phoneRef.current || !sceneState.live || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    emit("ring-open", { slug: c.slug });
  };

  return (
    <section
      ref={ref}
      className={s.stage}
      data-scene-stage
      aria-label={t.label}
      style={{ "--n": cases.length } as React.CSSProperties}
    >
      <div className={s.sticky} data-shown={shown ? "" : undefined} data-scene-sticky>
        <p className={`${s.hint} caps muted`}>
          <span className={s.mouse}>{t.mouse}</span>
          <span className={s.touch}>{t.touch}</span>
        </p>
        {phone && <Arc ref={arc} cases={cases} lang={lang} start={sceneState.active} onActive={onArc} />}
        <div className={`wrap ${s.caption}`} data-scene-caption>
          <div className={s.info} aria-live={announce ? "polite" : "off"}>
            <div className={s.dots} ref={dots}>
              <Stepper
                key={auto?.n ?? 0}
                className={`${s.stepper}${auto ? ` ${s.filling}` : ""}`}
                count={cases.length}
                active={active}
                filling={!!auto}
                fillDuration={auto ? Math.round(auto.wait * 1000) : 0}
                onStepClick={(i) => {
                  setAnnounce(true);
                  if (phoneRef.current) arc.current?.go(i);
                  else emit("ring-go", { index: i });
                }}
              />
              <p className="caps muted" aria-hidden="true">
                {pad(active + 1)} / {pad(cases.length)}
              </p>
            </div>
            <p className="visually-hidden">{t.of(active + 1, cases.length)}</p>
            {/* подписи всех работ лежат стопкой в одной клетке, видна одна: высота подписи — по самой
                длинной и не меняется при смене работы, поэтому кольцо над ней не прыгает в размере */}
            <div className={s.text}>
              <div key={c.slug}>
                <p className={s.title}>{c.title}</p>
                <p className={`${s.meta} muted`}>{c.meta}</p>
              </div>
              {cases.map((x) => (
                <div key={x.slug} className={s.ghost} aria-hidden="true">
                  <p className={s.title}>{x.title}</p>
                  <p className={`${s.meta} muted`}>{x.meta}</p>
                </div>
              ))}
            </div>
          </div>
          <div className={s.actions}>
            <button className="round" type="button" aria-label={t.prev} onClick={() => step(-1)}>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
            <button className="round" type="button" aria-label={t.next} onClick={() => step(1)}>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M7.5 4.5 13 10l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
            <Link className="btn" href={href(lang, `/cases/${c.slug}/`)} onClick={open} data-cursor="open" data-scene-open>
              {t.open}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- дуга кольца на телефоне ----------
// Карточки стоят на цилиндре большого радиуса: передняя прямо, соседние чуть повёрнуты и отходят
// назад всего на несколько процентов, поэтому при листании карточка почти не меняет размер.
// Палец ведёт кольцо сам (как на компьютере): вбок — крутим, и страница при этом стоит;
// вверх-вниз — обычная прокрутка страницы (touch-action: pan-y). Положение и отрисовка в одном кадре requestAnimationFrame,
// поэтому карточки идут ровно за пальцем. После отпускания пружина без отскока ставит работу
// по центру; заметный свайп всегда доводит хотя бы до соседней. Меняются только transform и opacity.
type ArcApi = { go: (i: number) => void };
const ARC_A = (16 * Math.PI) / 180; // поворот соседней карточки
const ARC_GAP = 16; // зазор между карточками, px

function Arc({
  ref,
  cases,
  lang,
  start,
  onActive,
}: {
  ref: React.Ref<ArcApi>;
  cases: StageCase[];
  lang: Lang;
  start: number;
  onActive: (i: number) => void;
}) {
  const t = dict[lang].stage;
  const box = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLAnchorElement | null)[]>([]);
  const n = cases.length;
  // pos — какая работа спереди (дробное — между ними), vel — скорость в работах за секунду
  const st = useRef({ pos: start, vel: 0, target: start, front: start, raf: 0, last: 0, dragged: false });
  const drag = useRef<null | { id: number; x: number; y: number; from: number; lock: "" | "x" | "y"; lastX: number; lastT: number; v: number }>(null);

  const width = () => cards.current[0]?.offsetWidth ?? 1;

  const draw = () => {
    const s = st.current;
    const w = width();
    const R = (w + ARC_GAP) / Math.sin(ARC_A);
    cards.current.forEach((card, i) => {
      if (!card) return;
      const d = i - s.pos;
      const ad = Math.abs(d);
      const th = d * ARC_A;
      const x = R * Math.sin(th);
      const z = R * (Math.cos(th) - 1);
      card.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, 0, ${z.toFixed(2)}px) rotateY(${th.toFixed(4)}rad)`;
      card.style.opacity = String(Math.max(0, 1 - 0.45 * Math.min(ad, 1) - 0.55 * Math.max(0, Math.min(ad - 1, 1))));
      card.style.visibility = ad > 2.2 ? "hidden" : "";
    });
    const f = Math.max(0, Math.min(n - 1, Math.round(s.pos)));
    if (f !== s.front) {
      s.front = f;
      onActive(f);
    }
  };

  // кадр: пока тянут — просто рисуем, после — пружина к target (критическое затухание, без отскока)
  const frame = (now: number) => {
    const s = st.current;
    s.raf = 0;
    const dt = Math.min(0.05, (now - (s.last || now)) / 1000);
    s.last = now;
    if (!drag.current?.lock) {
      const k = tune.spring;
      s.vel += (k * (s.target - s.pos) - 2 * Math.sqrt(k) * s.vel) * dt;
      s.pos += s.vel * dt;
      if (Math.abs(s.target - s.pos) < 0.0005 && Math.abs(s.vel) < 0.002) {
        s.pos = s.target;
        s.vel = 0;
        s.last = 0;
        draw();
        return;
      }
    }
    draw();
    s.raf = requestAnimationFrame(frame);
  };
  const kick = () => {
    if (!st.current.raf) st.current.raf = requestAnimationFrame(frame);
  };

  const go = (i: number) => {
    const s = st.current;
    s.target = Math.max(0, Math.min(n - 1, i));
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      s.pos = s.target;
      s.vel = 0;
      draw();
    } else kick();
  };
  useImperativeHandle(ref, () => ({ go }));

  useEffect(() => {
    draw();
    onActive(st.current.front);
    addEventListener("resize", draw);
    const s = st.current;
    // Safari листает страницу и при свайпе вбок (вертикальная часть движения пальца), touch-action
    // это не останавливает. Как только жест решён как «вбок», страницу держим на месте.
    // (verver: кручу дугу, а сайт пролистывается)
    const el = box.current;
    const hold = (e: TouchEvent) => {
      const d = drag.current;
      const p = e.touches[0];
      if (!d || !p || !e.cancelable) return;
      // touchmove может прийти раньше pointermove: тогда решаем по тому же правилу, что и onMove
      const dx = p.clientX - d.x;
      const dy = p.clientY - d.y;
      const side = d.lock ? d.lock === "x" : Math.abs(dx) + Math.abs(dy) >= 8 && Math.abs(dx) > Math.abs(dy) * 0.8;
      if (side) e.preventDefault();
    };
    el?.addEventListener("touchmove", hold, { passive: false });
    return () => {
      el?.removeEventListener("touchmove", hold);
      removeEventListener("resize", draw);
      cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
    // draw читает только изменяемое состояние и разметку
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, onActive]);

  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || drag.current) return;
    st.current.dragged = false;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, from: st.current.pos, lock: e.pointerType === "mouse" ? "x" : "", lastX: e.clientX, lastT: performance.now(), v: 0 };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    if (!d.lock) {
      const dy = e.clientY - d.y;
      if (Math.abs(dx) + Math.abs(dy) < 8) return;
      d.lock = Math.abs(dx) > Math.abs(dy) * 0.8 ? "x" : "y";
      if (d.lock === "y") {
        drag.current = null;
        return;
      }
      try {
        box.current?.setPointerCapture(e.pointerId);
      } catch {}
    }
    if (Math.abs(dx) > 6) st.current.dragged = true;
    const s = st.current;
    let pos = d.from - dx / (width() + ARC_GAP);
    // за первой и последней работой кольцо тянется туго
    if (pos < 0) pos *= 0.3;
    else if (pos > n - 1) pos = n - 1 + (pos - n + 1) * 0.3;
    const now = performance.now();
    const dt = Math.max(1, now - d.lastT) / 1000;
    d.v = d.v * 0.6 + (-(e.clientX - d.lastX) / (width() + ARC_GAP) / dt) * 0.4;
    d.lastX = e.clientX;
    d.lastT = now;
    s.pos = pos;
    s.vel = 0;
    kick();
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (d.lock !== "x" || !st.current.dragged) return;
    const s = st.current;
    const from = Math.round(d.from);
    let to = Math.round(s.pos + Math.max(-8, Math.min(8, d.v)) * 0.12);
    if (to === from && Math.abs(e.clientX - d.x) > 24) to = from + Math.sign(d.x - e.clientX);
    s.target = Math.max(0, Math.min(n - 1, to));
    s.vel = Math.max(-6, Math.min(6, d.v));
    kick();
  };

  // нажатие на соседнюю карточку сначала ставит её вперёд, нажатие на переднюю открывает работу
  const pick = (e: React.MouseEvent, i: number) => {
    if (st.current.dragged || i !== st.current.front) {
      e.preventDefault();
      if (!st.current.dragged) go(i);
    }
    st.current.dragged = false;
  };

  return (
    <div
      className={s.arc}
      ref={box}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {cases.map((c, i) => (
        <Link
          key={c.slug}
          className={s.card}
          ref={(el) => void (cards.current[i] = el)}
          href={href(lang, `/cases/${c.slug}/`)}
          aria-label={t.work(i + 1, c.title)}
          onClick={(e) => pick(e, i)}
          // с клавиатуры (Tab) карточка в фокусе выходит вперёд; нажатие мышью решает pick
          onFocus={(e) => e.currentTarget.matches(":focus-visible") && go(i)}
          draggable={false}
        >
          <Shot img={c.phone} alt="" sizes="62vw" draggable={false} />
        </Link>
      ))}
    </div>
  );
}
