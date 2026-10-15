import Link from "next/link";
import { pageMeta } from "@/lib/meta";
import { owner } from "@/lib/site";
import s from "./page.module.css";

export const metadata = pageMeta({
  title: "Политика конфиденциальности · verver",
  description: "Какие данные получает форма заявки, зачем и как попросить их удалить.",
  path: "/privacy/",
});

const sections: [string, React.ReactNode][] = [
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

export default function PrivacyPage() {
  return (
    <article className={`${s.policy} wrap`}>
      <header className={s.head}>
        <p className="caps muted">Редакция от&nbsp;11&nbsp;октября 2026&nbsp;года</p>
        {/* «конфиденциальности» — длинное слово: на узком телефоне переносится по слогу */}
        <h1 className={s.title}>Политика конфиденци&shy;альности</h1>
      </header>

      <div className={s.list}>
        {sections.map(([title, text]) => (
          <section key={title} className={s.row}>
            <h2 className={s.h2}>{title}</h2>
            <p className={s.text}>{text}</p>
          </section>
        ))}
      </div>

      <Link className={`${s.back} caps link`} href="/">
        ← На главную
      </Link>
    </article>
  );
}
