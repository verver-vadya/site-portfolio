import { getCases } from "@/lib/cases";
import { dict } from "@/lib/dict";
import type { Lang } from "@/lib/i18n";
import { CaseCard } from "./CaseCard";
import { ViewSwitch } from "./ViewSwitch";
import s from "./Works.module.css";

// Каталог работ на серых плашках с переключателем «Компьютер / Телефон».
// level: 1 на странице «Работы» (там это первый экран), 2 на главной (ниже другого содержимого).
export function Works({ level = 2, lang }: { level?: 1 | 2; lang: Lang }) {
  const cases = getCases(lang);
  const t = dict[lang].works;
  const H = level === 1 ? "h1" : "h2";
  const below = level === 2; // на главной блок ниже первого экрана: проявляется при прокрутке
  return (
    <section id="works" className={level === 1 ? `${s.works} ${s.page}` : s.works} data-view="desktop" aria-labelledby="works-title">
      <div className="wrap">
        <div className={s.head} data-reveal={below || undefined}>
          <H id="works-title" className={level === 1 ? s.title1 : s.title2}>
            {t.title} <span className={s.count}>({cases.length})</span>
          </H>
          <ViewSwitch labels={t} />
        </div>
        <ul className={s.grid}>
          {cases.map((c, i) => (
            <li
              key={c.slug}
              data-reveal={below || undefined}
              style={below ? ({ "--reveal-i": i % 3 } as React.CSSProperties) : undefined}
            >
              <CaseCard lang={lang} entry={c} heading={level === 1 ? "h2" : "h3"} priority={level === 1 && i < 2} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
