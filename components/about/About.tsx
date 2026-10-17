import { dict } from "@/lib/dict";
import type { Lang } from "@/lib/i18n";
import { owner, ownerIn } from "@/lib/site";
import { Me } from "./Me";
import s from "./About.module.css";

// «Обо мне»: кто делает сайты и что входит в работу
const text = {
  ru: {
    title: "Обо мне",
    lead: (name: string) => (
      <>
        Меня зовут {name}. Делаю сайты для небольших компаний и&nbsp;мастеров: от&nbsp;первого разговора
        до&nbsp;сайта, который работает на&nbsp;вашем хостинге и&nbsp;приводит заявки.
      </>
    ),
    steps: [
      ["Начало", <>Бриф, примеры, прототип главной за&nbsp;несколько дней</>],
      ["Сайт", <>Дизайн под нишу, вёрстка для компьютера и&nbsp;телефона</>],
      ["Заявки", <>Формы, онлайн-запись, оплата через ЮKassa</>],
      ["Запуск", <>Хостинг и&nbsp;домен на&nbsp;ваше имя, Яндекс Метрика, 152-ФЗ</>],
      ["После", <>Две недели бесплатных правок, потом поддержка по&nbsp;договорённости</>],
    ] as [string, React.ReactNode][],
    direct: "Напрямую",
  },
  en: {
    title: "About",
    lead: (name: string) => (
      <>
        I’m {name}. I build websites for small companies and&nbsp;independent professionals: from the first
        conversation to&nbsp;a&nbsp;site that runs on&nbsp;your hosting and brings in&nbsp;requests.
      </>
    ),
    steps: [
      ["Start", <>Brief, references, a&nbsp;homepage prototype in&nbsp;a&nbsp;few days</>],
      ["Site", <>Design for your niche, layout for desktop and&nbsp;phone</>],
      ["Requests", <>Forms, online booking, payments through Stripe or&nbsp;a&nbsp;local provider</>],
      ["Launch", <>Hosting and domain in&nbsp;your name, analytics, privacy rules of&nbsp;your country (GDPR, CCPA)</>],
      ["After", <>Two weeks of&nbsp;free fixes, then support as&nbsp;agreed</>],
    ] as [string, React.ReactNode][],
    direct: "Directly",
  },
};

export function About({ lang }: { lang: Lang }) {
  const t = text[lang];
  const me = ownerIn(lang);
  return (
    <section className={`${s.about} wrap`} aria-labelledby="about-title">
      <h1 id="about-title" className={s.title}>
        {t.title}
      </h1>
      <div className={s.grid}>
        <div className={s.who}>
          <Me className={s.avatar} alt={dict[lang].photo(me.name)} />
          <p className={s.sign}>
            <span>{me.name}</span>
            <span className="caps muted">{me.status}</span>
          </p>
        </div>
        <div className={s.body}>
          <p className={s.lead}>{t.lead(me.name)}</p>
          <dl className={s.list}>
            {t.steps.map(([dt, dd]) => (
              <div key={dt} className={s.row}>
                <dt className="caps muted">{dt}</dt>
                <dd>{dd}</dd>
              </div>
            ))}
          </dl>
          <div className={s.direct} data-reveal>
            <p className="caps muted">{t.direct}</p>
            <p className={s.links}>
              <a className="link" href={`https://t.me/${owner.telegram}`} target="_blank" rel="noopener">
                Telegram @{owner.telegram}
              </a>
              <a className="link" href={`mailto:${owner.email}`}>
                {owner.email}
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
