"use client";
// Сцена кольца на главной: пока кольцо стоит, внизу подпись работы, которая сейчас спереди,
// кнопки ← → и «Открыть». Само кольцо рисует 3D-сцена; без неё этот блок скрыт и ниже идёт
// обычный список работ.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { emit, on, sceneState } from "@/lib/scene-bus";
import s from "./Stage.module.css";

export type StageCase = { slug: string; title: string; meta: string; tagline?: string };

export function Stage({ cases }: { cases: StageCase[] }) {
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => on("ring-active", ({ index }) => setActive(index)), []);

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
          <div className={s.info} aria-live="polite">
            <p className="caps muted">
              Работа {pad(active + 1)} из&nbsp;{pad(cases.length)}
            </p>
            <p className={s.title} key={c.slug}>
              {c.title}
            </p>
            <p className={`${s.meta} muted`}>{c.meta}</p>
          </div>
          <div className={s.actions}>
            <button className="round" type="button" aria-label="Предыдущая работа" onClick={() => emit("ring-step", { dir: -1 })}>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
            <button className="round" type="button" aria-label="Следующая работа" onClick={() => emit("ring-step", { dir: 1 })}>
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
