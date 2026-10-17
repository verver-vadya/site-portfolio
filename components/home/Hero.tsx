import { WORD_PATH } from "@/lib/brand";
import { dict } from "@/lib/dict";
import type { Lang } from "@/lib/i18n";
import s from "./Hero.module.css";

// Первый экран главной. Надпись verver с отражением здесь нарисована обычным SVG:
// её видно сразу и без WebGL. Когда загрузится 3D-сцена, она встаёт точно на место этой надписи
// (data-scene-word), а SVG растворяется.
export function Hero({ lang }: { lang: Lang }) {
  const t = dict[lang].hero;
  return (
    <section className={s.hero} data-scene-hero aria-labelledby="hero-title">
      <div className={`wrap ${s.top}`}>
        <h1 id="hero-title" className={s.title}>
          {t.title}
        </h1>
        <p className={`${s.lede} muted`}>
          {t.lede}
        </p>
      </div>
      <div className={s.word} aria-hidden="true" data-overlap-ok>
        <svg className={s.svg} viewBox="1 -588 4097 604" data-scene-word focusable="false">
          <path d={WORD_PATH} fill="currentColor" />
        </svg>
        <svg className={`${s.svg} ${s.reflection}`} viewBox="1 -588 4097 604" focusable="false">
          <path d={WORD_PATH} fill="currentColor" />
        </svg>
      </div>
      <p className={`${s.hint} caps muted`}>
        <span className={s.withScene}>{t.hintScene}</span>
        <span className={s.noScene}>{t.hintPlain}</span>
      </p>
    </section>
  );
}
