import { WORD_PATH } from "@/lib/brand";
import s from "./Hero.module.css";

// Первый экран главной. Надпись verver с отражением здесь нарисована обычным SVG:
// её видно сразу и без WebGL. Когда загрузится 3D-сцена, она встаёт точно на место этой надписи
// (data-scene-word), а SVG растворяется.
export function Hero() {
  return (
    <section className={s.hero} data-scene-hero aria-labelledby="hero-title">
      <div className={`wrap ${s.top}`}>
        <h1 id="hero-title" className={s.title}>
          Сайты под задачу бизнеса: от&nbsp;брифа до&nbsp;запуска
        </h1>
        <p className={`${s.lede} muted`}>
          Дизайн, вёрстка, формы и&nbsp;онлайн-запись. Сайт, хостинг и&nbsp;домен оформляются на&nbsp;владельца.
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
        <span className={s.withScene}>Листайте: работы поднимутся из&nbsp;воды</span>
        <span className={s.noScene}>Работы ниже</span>
      </p>
    </section>
  );
}
