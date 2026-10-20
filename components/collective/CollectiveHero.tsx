import type { Lang } from "@/lib/i18n";
import { Sparks } from "./Sparks";
import s from "./CollectiveHero.module.css";

// Первый экран страницы «Объединение»: сетка, искры и огромная надпись в несколько строк.
// Строки выезжают снизу из-под своей кромки (CSS, поэтому текст виден и без JS).
const text = {
  ru: {
    label: "Объединение verver",
    lines: ["Сильные", "дизайнеры", "под одну", "задачу"],
    title: "Сильные дизайнеры под одну задачу",
    lede: "Под проект собираю команду: дизайн, 3D и анимация, разработка, фото и тексты. Договор один, и отвечаю за результат я.",
  },
  en: {
    label: "verver collective",
    lines: ["Strong", "designers", "for one", "project"],
    title: "Strong designers for one project",
    lede: "I assemble a team for each project: design, 3D and motion, development, photo and copy. One contract, and I answer for the result.",
  },
};

export function CollectiveHero({ lang }: { lang: Lang }) {
  const t = text[lang];
  return (
    <section className={s.hero} aria-labelledby="collective-title">
      <div className={s.grid} aria-hidden="true" />
      <Sparks className={s.sparks} />
      <div className={`wrap ${s.in}`}>
        <p className={`${s.pill} caps`}>{t.label}</p>
        <h1 id="collective-title" className={s.title} aria-label={t.title}>
          {t.lines.map((line, i) => (
            <span key={line} className={s.line} aria-hidden="true" style={{ "--i": i } as React.CSSProperties}>
              <span className={s.lineIn}>{line}</span>
            </span>
          ))}
        </h1>
        <p className={`${s.lede} muted`}>{t.lede}</p>
      </div>
    </section>
  );
}
