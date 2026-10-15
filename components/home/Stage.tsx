"use client";
// Сцена кольца на главной: пока кольцо стоит, внизу подпись работы, которая сейчас спереди,
// кнопки ← → и «Открыть». Само кольцо рисует 3D-сцена; без неё этот блок скрыт и ниже идёт
// обычный список работ.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Stepper } from "pasito";
import "pasito/styles.css";
import { emit, on, sceneState } from "@/lib/scene-bus";
import s from "./Stage.module.css";

export type StageCase = { slug: string; title: string; meta: string; tagline?: string };

export function Stage({ cases }: { cases: StageCase[] }) {
  const [active, setActive] = useState(() => sceneState.active);
  const [shown, setShown] = useState(false);
  // подпись зачитывается вслух только после нажатия ← →, а не при каждом шаге кольца само по себе
  const [announce, setAnnounce] = useState(false);
  const step = (dir: 1 | -1) => {
    setAnnounce(true);
    emit("ring-step", { dir });
  };
  const ref = useRef<HTMLElement>(null);

  useEffect(() => on("ring-active", ({ index }) => setActive(index)), []);

  // точки работ (Pasito): активная заполняется до следующего шага, пока кольцо крутится само
  const [auto, setAuto] = useState<{ wait: number; n: number } | null>(null);
  useEffect(() => on("ring-auto", ({ wait }) => setAuto((a) => (wait === null ? null : { wait, n: (a?.n ?? 0) + 1 }))), []);
  const dots = useRef<HTMLDivElement>(null);
  // у Pasito подписи точек по-английски («Step 1»): ставим свои
  useEffect(() => {
    dots.current?.querySelector("[aria-label]")?.setAttribute("aria-label", "Работы на кольце");
    dots.current?.querySelectorAll<HTMLElement>(".pasito-step").forEach((el, i) => {
      if (cases[i]) el.setAttribute("aria-label", `Работа ${i + 1}: ${cases[i].title}`);
    });
  });

  // подпись видна, пока кольцо стоит на экране
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setShown(r.top < innerHeight * 0.25 && r.bottom > innerHeight * 0.6);
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
    if (!sceneState.live || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    emit("ring-open", { slug: c.slug });
  };

  return (
    <section ref={ref} className={s.stage} data-scene-stage aria-label="Работы на кольце">
      <div className={s.sticky} data-shown={shown ? "" : undefined}>
        <p className={`${s.hint} caps muted`}>
          <span className={s.mouse}>Тяните кольцо, чтобы покрутить, нажмите на&nbsp;экран, чтобы открыть</span>
          <span className={s.touch}>Листайте кольцо пальцем, нажмите на&nbsp;экран, чтобы открыть</span>
        </p>
        <div className={`wrap ${s.caption}`}>
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
                  emit("ring-go", { index: i });
                }}
              />
              <p className="caps muted" aria-hidden="true">
                {pad(active + 1)} / {pad(cases.length)}
              </p>
            </div>
            <p className="visually-hidden">
              Работа {active + 1} из&nbsp;{cases.length}
            </p>
            <p className={s.title} key={c.slug}>
              {c.title}
            </p>
            <p className={`${s.meta} muted`}>{c.meta}</p>
          </div>
          <div className={s.actions}>
            <button className="round" type="button" aria-label="Предыдущая работа" onClick={() => step(-1)}>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
            <button className="round" type="button" aria-label="Следующая работа" onClick={() => step(1)}>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M7.5 4.5 13 10l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
            <Link className="btn" href={`/cases/${c.slug}/`} onClick={open} data-cursor="open" data-scene-open>
              Открыть работу
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
