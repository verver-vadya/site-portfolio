import Link from "next/link";
import { href, type Lang } from "@/lib/i18n";
import { owner } from "@/lib/site";
import s from "@/app/privacy/page.module.css";

const sectionsRu: [string, React.ReactNode][] = [
  [
    "1. Кто обрабатывает данные",
    <>
      Оператор персональных данных: {owner.fullName}, {owner.status}, ИНН&nbsp;{owner.inn}. По&nbsp;вопросам обработки
      данных пишите на&nbsp;<a className={`link ${s.line}`} href={`mailto:${owner.email}`}>{owner.email}</a>.
    </>,
  ],
  [
    "2. Какие данные я получаю",
    <>
      То, что вы указываете в&nbsp;форме заявки: имя, ник в&nbsp;Telegram, телефон или почту, пару слов о&nbsp;бизнесе,
      тип сайта, сроки, бюджет и&nbsp;комментарий. Сайт не&nbsp;ставит cookie и&nbsp;не&nbsp;использует счётчики посещаемости.
      Хостинг сайта (GitHub Pages, США), как любой хостинг, видит технические данные запроса: <span className={s.nowrap}>IP-адрес</span> и&nbsp;браузер.
    </>,
  ],
  [
    "3. Зачем",
    <>
      Чтобы ответить на&nbsp;заявку и&nbsp;обсудить сайт. Данные не&nbsp;используются для рассылок и&nbsp;не&nbsp;передаются
      третьим лицам, кроме сервиса, который доставляет заявки. Заявка проходит через сервис Formspree (Formspree, Inc., США)
      и&nbsp;приходит мне на&nbsp;почту {owner.email}. Отправляя форму, вы соглашаетесь на&nbsp;такую передачу данных.
    </>,
  ],
  [
    "4. Основание и сроки",
    <>
      Основание — ваше согласие, которое вы даёте, отмечая галочку в&nbsp;форме. Данные хранятся один год после
      последнего сообщения и&nbsp;удаляются по&nbsp;истечении срока или по&nbsp;вашему запросу.
    </>,
  ],
  [
    "5. Ваши права",
    <>
      Вы можете узнать, какие данные о&nbsp;вас хранятся, попросить исправить или удалить их и&nbsp;отозвать согласие,
      написав на&nbsp;<a className={`link ${s.line}`} href={`mailto:${owner.email}`}>{owner.email}</a>. Отвечу
      в&nbsp;течение 10&nbsp;рабочих дней.
    </>,
  ],
];

const sectionsEn: [string, React.ReactNode][] = [
  [
    "1. Who processes the data",
    <>
      The data controller is {owner.en.fullName}, {owner.en.status} (Russia), tax ID&nbsp;{owner.inn}. For any question about
      your data, write to&nbsp;<a className={`link ${s.line}`} href={`mailto:${owner.email}`}>{owner.email}</a>.
    </>,
  ],
  [
    "2. What data I receive",
    <>
      What you enter in&nbsp;the request form: your name, Telegram handle, phone or email, a&nbsp;few words about your business,
      the type of&nbsp;site, timeline, budget and comment. The site sets no cookies and uses no visitor analytics.
      Like any hosting, the site’s hosting (GitHub Pages, USA) sees technical request data: <span className={s.nowrap}>IP address</span> and browser.
    </>,
  ],
  [
    "3. Why",
    <>
      To&nbsp;answer your request and discuss the site. The data isn’t used for mailings and isn’t shared with third parties,
      except the service that delivers requests. Requests go through Formspree (Formspree, Inc., USA) and arrive
      at&nbsp;my email {owner.email}. By&nbsp;sending the form you agree to&nbsp;this transfer.
    </>,
  ],
  [
    "4. Legal basis and retention",
    <>
      The basis is your consent, which you give by ticking the box in&nbsp;the form (GDPR Art.&nbsp;6(1)(a)). The data is kept
      for one year after the last message and deleted when that period ends or&nbsp;when you ask.
    </>,
  ],
  [
    "5. Your rights",
    <>
      You can find out what data about you is stored, ask to&nbsp;correct or&nbsp;delete it and withdraw your consent
      by writing to&nbsp;<a className={`link ${s.line}`} href={`mailto:${owner.email}`}>{owner.email}</a>. I&nbsp;reply
      within 10&nbsp;working days.
    </>,
  ],
];

const text = {
  ru: { date: <>Редакция от&nbsp;11&nbsp;октября 2026&nbsp;года</>, title: <>Политика конфиденци&shy;альности</>, home: "← На главную" },
  en: { date: <>Version of&nbsp;17&nbsp;October 2026</>, title: <>Privacy policy</>, home: "← Home" },
};

export function PrivacyView({ lang }: { lang: Lang }) {
  const t = text[lang];
  const sections = lang === "en" ? sectionsEn : sectionsRu;
  return (
    <article className={`${s.policy} wrap`}>
      <header className={s.head}>
        <p className="caps muted">{t.date}</p>
        {/* «конфиденциальности» — длинное слово: на узком телефоне переносится по слогу */}
        <h1 className={s.title}>{t.title}</h1>
      </header>

      <div className={s.list}>
        {sections.map(([title, text]) => (
          <section key={title} className={s.row}>
            <h2 className={s.h2}>{title}</h2>
            <p className={s.text}>{text}</p>
          </section>
        ))}
      </div>

      <Link className={`${s.back} caps link`} href={href(lang, "/")}>
        {t.home}
      </Link>
    </article>
  );
}
