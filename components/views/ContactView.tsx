import { Me } from "@/components/about/Me";
import { BackLink } from "@/components/form/BackLink";
import { CopyButton } from "@/components/CopyButton";
import { RequestForm } from "@/components/form/RequestForm";
import { dict } from "@/lib/dict";
import type { Lang } from "@/lib/i18n";
import { owner, ownerIn } from "@/lib/site";
import s from "@/app/contact/page.module.css";

const text = {
  ru: {
    title: "Заявка",
    lead: <>Расскажите о&nbsp;задаче</>,
    me: (name: string) => `Отвечу я, ${name}.`,
    easy: <>Четыре вопроса, пара минут, ни&nbsp;к&nbsp;чему не&nbsp;обязывает.</>,
    direct: "Или напрямую",
    next: [
      <>Отвечу в&nbsp;течение дня туда, куда вы указали</>,
      <>Если нужно, созвонимся на&nbsp;15&nbsp;минут</>,
      <>Пришлю цену, сроки и&nbsp;что войдёт в&nbsp;работу</>,
    ],
  },
  en: {
    title: "Request",
    lead: <>Tell me about your project</>,
    me: (name: string) => `${name} here, I’ll reply myself.`,
    easy: <>Four questions, a&nbsp;couple of&nbsp;minutes, no&nbsp;commitment.</>,
    direct: "Or directly",
    next: [
      <>I’ll reply within a&nbsp;day wherever you said</>,
      <>If needed, we’ll have a&nbsp;15-minute call</>,
      <>I’ll send the price, timeline and what the work includes</>,
    ],
  },
};

// Заявка: четыре вопроса брифа, согласие на обработку данных и запасной путь — Telegram и почта
export function ContactView({ lang }: { lang: Lang }) {
  const t = text[lang];
  const d = dict[lang];
  const me = ownerIn(lang);
  return (
    <section className={`${s.contact} wrap`} aria-labelledby="contact-title">
      <div className={s.top}>
        <BackLink className={s.back} />
      </div>
      <h1 id="contact-title" className={s.title} data-g-rise="">
        {t.title}
      </h1>

      <div className={s.grid}>
        <p className={s.lead}>{t.lead}</p>

        <div className={s.aside}>
          <div className={s.who}>
            <Me size={64} alt={d.photo(me.name)} />
            <p>
              <b className={s.name}>{t.me(me.name)}</b> <span className="muted">{t.easy}</span>
            </p>
          </div>

          <div className={s.direct}>
            <p className="caps muted">{t.direct}</p>
            <a className="link" href={`https://t.me/${owner.telegram}`} target="_blank" rel="noopener">
              Telegram @{owner.telegram}
            </a>
            <a className="link" href={`https://t.me/${owner.channel}`} target="_blank" rel="noopener">
              {d.footer.channel} @{owner.channel}
            </a>
            <span className={s.mail}>
              <a className="link" href={`mailto:${owner.email}`}>
                {owner.email}
              </a>
              <CopyButton text={owner.email} label={d.copy.mail} lang={lang} />
            </span>
          </div>
        </div>

        <div className={s.form}>
          <RequestForm lang={lang} />
        </div>

        <ol className={s.next} data-reveal>
          {t.next.map((x, i) => (
            <li key={i}>
              <span className="caps muted">{String(i + 1).padStart(2, "0")}</span>
              {x}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
