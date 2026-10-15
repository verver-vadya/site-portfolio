import Link from "next/link";
import s from "./Prices.module.css";

// Неразрывный пробел после коротких слов («в&nbsp;год», «не&nbsp;меняется»), как в старой вёрстке
const nb = (t: string) => t.replace(/(^|[\s(«])([а-яёА-ЯЁ]{1,2})\s/g, "$1$2 ").replace(/(^|[\s(«])([а-яёА-ЯЁ]{1,2})\s/g, "$1$2 ");
// 15000 → «15 000» с неразрывным пробелом
const money = (n: number) => n.toLocaleString("ru-RU").replace(/\s/g, " ");

// Цены «от» и сроки. Это цены для первых пяти проектов: когда кейсы и отзывы наберутся,
// поднять цифры и убрать абзац «Первые пять проектов».
// value совпадает с вариантом «Какой сайт нужен» в форме: «Обсудить» открывает заявку с ним.
const plans = [
  {
    value: "Лендинг",
    name: "Лендинг",
    from: 15000,
    usual: "обычно 15–20 тысяч",
    fit: "Подходит, если у вас одна услуга, акция или запуск и нужно быстро начать получать заявки.",
    term: "1–2 недели",
    items: [
      "Одна страница под услугу, акцию или запуск",
      "Заявки в Telegram или на почту",
      "Вёрстка для компьютера и телефона",
      "Яндекс Метрика и согласие по 152-ФЗ",
    ],
  },
  {
    value: "Визитка или портфолио",
    name: "Сайт-визитка",
    from: 25000,
    usual: "обычно 25–35 тысяч",
    fit: "Подходит мастерам и небольшим компаниям, которым нужен понятный сайт с услугами и работами.",
    term: "2–3 недели",
    items: [
      "До пяти страниц: услуги, работы, о вас, контакты",
      "Дизайн под нишу, а не шаблон",
      "Формы, карта, ссылки на соцсети",
      "Заголовки и карта сайта для поисковиков",
    ],
  },
  {
    value: "Сайт с записью или каталогом",
    name: "Запись или каталог",
    from: 45000,
    usual: "обычно 45–70 тысяч",
    fit: "Подходит салонам, студиям и магазинам, где клиент выбирает услугу и сразу записывается или покупает.",
    term: "3–5 недель",
    items: [
      "Онлайн-запись через YClients или DIKIDI",
      "Каталог услуг или товаров с фильтрами",
      "Оплата через ЮKassa",
      "Простая админка для текстов и цен",
    ],
  },
];

export function Prices() {
  return (
    <section className={`${s.prices} wrap`} aria-labelledby="prices-title">
      <div className={s.head}>
        <h1 id="prices-title" className={s.title}>
          Цены и&nbsp;сроки
        </h1>
        <p className={s.lede}>
          Точную цену называю после брифа, она не&nbsp;меняется по&nbsp;ходу работы, если не&nbsp;меняется задача.
        </p>
        <p className={s.first}>
          <span className="tag caps">Первые пять проектов</span>
          <span>
            Цены ниже обычных, а&nbsp;взамен отзыв и&nbsp;разрешение показать сайт в&nbsp;портфолио.
          </span>
        </p>
      </div>

      <ol className={s.grid}>
        {plans.map((p, i) => (
          <li key={p.value} className={s.plan}>
            <p className={`${s.top} caps`}>
              <span className="muted">{String(i + 1).padStart(2, "0")}</span>
              <span>{p.term.replace(" ", " ")}</span>
            </p>
            <div className={s.about}>
              <h2 className={s.name}>{p.name}</h2>
              <p className={`${s.fit} muted`}>{nb(p.fit)}</p>
            </div>
            <p className={s.price}>
              <span className={`${s.from} caps muted`}>от</span>
              <span className={s.num}>
                {money(p.from)}
                <span className={s.rub}>&nbsp;₽</span>
              </span>
              <span className={`${s.usual} muted`}>{nb(p.usual)}</span>
            </p>
            <div className={s.rest}>
              <ul className={s.list}>
                {p.items.map((it) => (
                  <li key={it}>{nb(it)}</li>
                ))}
              </ul>
              <Link className={`${s.go} caps link`} href={`/contact/?type=${encodeURIComponent(p.value)}`} prefetch={false}>
                Обсудить
                <span className="visually-hidden">: {p.name.toLowerCase()}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </li>
        ))}
      </ol>

      <ul className={s.promises}>
        <li data-reveal>
          <span className="caps">Гарантия</span>
          <span>Если прототип главной не&nbsp;понравится, верну предоплату целиком.</span>
        </li>
        <li data-reveal style={{ "--reveal-i": 1 } as React.CSSProperties}>
          <span className="caps">Оплата</span>
          <span>По&nbsp;договору: предоплата 30–50&nbsp;%, остаток после запуска.</span>
        </li>
        <li data-reveal style={{ "--reveal-i": 2 } as React.CSSProperties}>
          <span className="caps">Хостинг и&nbsp;домен</span>
          <span>Покупаются на&nbsp;ваше имя и&nbsp;оплачиваются отдельно, обычно 3–6&nbsp;тысяч рублей в&nbsp;год.</span>
        </li>
      </ul>
    </section>
  );
}
