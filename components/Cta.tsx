import Link from "next/link";
import { dict } from "@/lib/dict";
import { href, type Lang } from "@/lib/i18n";
import s from "./Cta.module.css";

// Призыв в конце страницы: оставить заявку, рядом ссылки на соседние разделы
export function Cta({ links = [], lang }: { links?: { label: string; to: string }[]; lang: Lang }) {
  const t = dict[lang].cta;
  return (
    <section className={`${s.cta} wrap`} aria-labelledby="cta-title">
      <p className="caps muted" data-reveal>
        {t.eyebrow}
      </p>
      <div className={s.body}>
        <h2 id="cta-title" className={s.title} data-reveal>
          {t.title}
        </h2>
        <div className={s.row} data-reveal style={{ "--reveal-i": 1 } as React.CSSProperties}>
          <Link className="btn" href={href(lang, "/contact/")}>
            {t.button}
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
