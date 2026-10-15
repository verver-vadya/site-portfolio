import { Me } from "@/components/about/Me";
import { BackLink } from "@/components/form/BackLink";
import { CopyButton } from "@/components/CopyButton";
import { RequestForm } from "@/components/form/RequestForm";
import { pageMeta } from "@/lib/meta";
import { owner } from "@/lib/site";
import s from "./page.module.css";

export const metadata = pageMeta({
  title: "Заявка · verver",
  description: "Расскажите о задаче: четыре вопроса, пара минут. Отвечу в течение дня.",
  path: "/contact/",
});

// Заявка: четыре вопроса брифа, согласие по 152-ФЗ и запасной путь — Telegram и почта
export default function ContactPage() {
  return (
    <section className={`${s.contact} wrap`} aria-labelledby="contact-title">
      <div className={s.top}>
        <BackLink className={s.back} />
      </div>
      <h1 id="contact-title" className={s.title}>
        Заявка
      </h1>

      <div className={s.grid}>
        <p className={s.lead}>Расскажите о&nbsp;задаче</p>

        <div className={s.aside}>
          <div className={s.who}>
            <Me size={64} />
            <p>
              <b className={s.name}>Отвечу я, {owner.name}.</b>{" "}
              <span className="muted">Четыре вопроса, пара минут, ни&nbsp;к&nbsp;чему не&nbsp;обязывает.</span>
            </p>
          </div>

          <div className={s.direct}>
            <p className="caps muted">Или напрямую</p>
            <a className="link" href={`https://t.me/${owner.telegram}`} target="_blank" rel="noopener">
              Telegram @{owner.telegram}
            </a>
            <span className={s.mail}>
              <a className="link" href={`mailto:${owner.email}`}>
                {owner.email}
              </a>
              <CopyButton text={owner.email} label="Скопировать почту" />
            </span>
          </div>
        </div>

        <div className={s.form}>
          <RequestForm />
        </div>

        <ol className={s.next} data-reveal>
          <li>
            <span className="caps muted">01</span>Отвечу в&nbsp;течение дня туда, куда вы указали
          </li>
          <li>
            <span className="caps muted">02</span>Если нужно, созвонимся на&nbsp;15&nbsp;минут
          </li>
          <li>
            <span className="caps muted">03</span>Пришлю цену, сроки и&nbsp;что войдёт в&nbsp;работу
          </li>
        </ol>
      </div>
    </section>
  );
}
