import Link from "next/link";
import { Shot } from "@/components/Shot";
import type { Case } from "@/lib/cases";
import { dict } from "@/lib/dict";
import { href, type Lang } from "@/lib/i18n";
import s from "./CaseCard.module.css";

// Карточка работы: скриншот на серой плашке, как вещь в каталоге. Вся карточка — одна ссылка.
// Видно экран компьютера или телефона: решает data-view у блока работ.
export function CaseCard({
  entry: c,
  heading: H = "h3",
  priority = false,
  lang,
}: {
  lang: Lang;
  entry: Case;
  heading?: "h2" | "h3";
  priority?: boolean;
}) {
  return (
    <Link className={s.card} href={href(lang, `/cases/${c.slug}/`)} data-cursor="open">
      <div className={s.plate}>
        <Shot
          className={`${s.shot} ${s.desktop}`}
          img={c.desktop[0]}
          alt="" // ссылку называет заголовок карточки; второй, скрытый скриншот не зачитываем
          sizes="(max-width: 720px) 80vw, (max-width: 1200px) 42vw, 28vw"
          priority={priority}
        />
        <Shot
          className={`${s.shot} ${s.phone}`}
          img={c.phone[0]}
          alt=""
          sizes="(max-width: 720px) 26vw, 10vw"
        />
      </div>
      <div className={s.text}>
        <H className={s.title}>{c.title}</H>
        <span className={`${s.tag} tag caps`}>{dict[lang].status[c.status]}</span>
        <p className={`${s.meta} muted`}>
          {c.niche}, {c.city}, {c.year}
        </p>
        {c.tagline && <p className={s.line}>{c.tagline}</p>}
      </div>
    </Link>
  );
}
