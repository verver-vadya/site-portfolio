import { owner } from "@/lib/site";
import { Me } from "./Me";
import s from "./About.module.css";

// «Обо мне»: кто делает сайты и что входит в работу
const steps: [string, React.ReactNode][] = [
  ["Начало", <>Бриф, примеры, прототип главной за&nbsp;несколько дней</>],
  ["Сайт", <>Дизайн под нишу, вёрстка для компьютера и&nbsp;телефона</>],
  ["Заявки", <>Формы, онлайн-запись, оплата через ЮKassa</>],
  ["Запуск", <>Хостинг и&nbsp;домен на&nbsp;ваше имя, Яндекс Метрика, 152-ФЗ</>],
  ["После", <>Две недели бесплатных правок, потом поддержка по&nbsp;договорённости</>],
];

export function About() {
  return (
    <section className={`${s.about} wrap`} aria-labelledby="about-title">
      <h1 id="about-title" className={s.title}>
        Обо мне
      </h1>
      <div className={s.grid}>
        <div className={s.who}>
          <Me className={s.avatar} />
          <p className={s.sign}>
            <span>{owner.name}</span>
            <span className="caps muted">{owner.status}</span>
          </p>
        </div>
        <div className={s.body}>
          <p className={s.lead}>
            Меня зовут {owner.name}. Делаю сайты для небольших компаний и&nbsp;мастеров: от&nbsp;первого разговора
            до&nbsp;сайта, который работает на&nbsp;вашем хостинге и&nbsp;приводит заявки.
          </p>
          <dl className={s.list}>
            {steps.map(([dt, dd]) => (
              <div key={dt} className={s.row}>
                <dt className="caps muted">{dt}</dt>
                <dd>{dd}</dd>
              </div>
            ))}
          </dl>
          <div className={s.direct} data-reveal>
            <p className="caps muted">Напрямую</p>
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
