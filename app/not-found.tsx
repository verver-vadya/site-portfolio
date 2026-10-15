import Link from "next/link";
import { MARK_BOTTOM, MARK_TOP } from "@/lib/brand";
import { pageMeta } from "@/lib/meta";
import s from "./not-found.module.css";

// У 404 нет своего адреса: canonical не нужен
const { alternates: _, ...meta } = pageMeta({
  title: "Страница не найдена · verver",
  description: "Такой страницы нет: вернитесь на главную или откройте работы.",
  path: "/404.html",
});
export const metadata = meta;

export default function NotFound() {
  return (
    <section className={`${s.nf} wrap`} aria-labelledby="nf-title">
      <div className={s.text}>
        <p className="caps muted">Ошибка 404</p>
        <h1 id="nf-title" className={s.title}>
          Такой страницы нет
        </h1>
        <p className={s.lead}>Возможно, ссылка устарела или в&nbsp;адресе опечатка.</p>
        <div className={s.actions}>
          <Link className="btn" href="/">
            На главную
          </Link>
          <Link className={`${s.link} caps link`} href="/works/">
            Работы
          </Link>
          <Link className={`${s.link} caps link`} href="/contact/">
            Связаться
          </Link>
        </div>
      </div>

      {/* знак verver контуром: верхняя половина-отражение бледнее */}
      <svg className={s.mark} viewBox="-52 -52 104 104" aria-hidden="true" focusable="false">
        <polygon className={s.top} points={MARK_TOP} />
        <polygon className={s.bottom} points={MARK_BOTTOM} />
      </svg>
    </section>
  );
}
