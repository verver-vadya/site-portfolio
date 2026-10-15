import Link from "next/link";
import s from "./Cta.module.css";

// Призыв в конце страницы: оставить заявку, рядом ссылки на соседние разделы
export function Cta({ links = [] }: { links?: { label: string; to: string }[] }) {
  return (
    <section className={`${s.cta} wrap`} aria-labelledby="cta-title">
      <p className="caps muted" data-reveal>
        Дальше
      </p>
      <div className={s.body}>
        <h2 id="cta-title" className={s.title} data-reveal>
          Расскажите о&nbsp;задаче, отвечу в&nbsp;течение дня
        </h2>
        <div className={s.row} data-reveal style={{ "--reveal-i": 1 } as React.CSSProperties}>
          <Link className="btn" href="/contact/">
            Оставить заявку
          </Link>
          {links.map((l) => (
            <Link key={l.to} className={`link caps ${s.link}`} href={l.to}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
