import Link from "next/link";
import { href, type Lang } from "@/lib/i18n";
import s from "./Prices.module.css";

// Неразрывный пробел после коротких слов («в&nbsp;год», «не&nbsp;меняется»), как в старой вёрстке
const nb = (t: string) => t.replace(/(^|[\s(«])([а-яёА-ЯЁ]{1,2})\s/g, "$1$2 ").replace(/(^|[\s(«])([а-яёА-ЯЁ]{1,2})\s/g, "$1$2 ");

// Цены «от» и сроки. Это цены для первых пяти проектов: когда кейсы и отзывы наберутся,
// поднять цифры и убрать абзац «Первые пять проектов».
// value совпадает с вариантом «Какой сайт нужен» в форме: «Обсудить» открывает заявку с ним.
const plansRu = [
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

// Английская версия: цены в долларах для заказчиков из других стран
const plansEn: typeof plansRu = [
  {
    value: "Landing page",
    name: "Landing page",
    from: 300,
    usual: "usually $300–400",
    fit: "For a single service, offer or launch when you need to start getting requests fast.",
    term: "1–2 weeks",
    items: [
      "One page for a service, offer or launch",
      "Requests to Telegram, WhatsApp or email",
      "Layout for desktop and phone",
      "Analytics and a privacy consent that fits your country’s law",
    ],
  },
  {
    value: "Business site or portfolio",
    name: "Business site",
    from: 500,
    usual: "usually $500–700",
    fit: "For craftspeople and small companies that need a clear site with services and work.",
    term: "2–3 weeks",
    items: [
      "Up to five pages: services, work, about you, contacts",
      "Design for your niche, not a template",
      "Forms, a map, links to social media",
      "Titles and a sitemap for search engines",
    ],
  },
  {
    value: "Site with booking or a catalogue",
    name: "Booking or catalogue",
    from: 900,
    usual: "usually $900–1,400",
    fit: "For salons, studios and shops where a client picks a service and books or buys right away.",
    term: "3–5 weeks",
    items: [
      "Online booking through a service you already use",
      "A catalogue of services or products with filters",
      "Payments through Stripe or a local provider",
      "A simple admin panel for texts and prices",
    ],
  },
];

const text = {
  ru: {
    title: <>Цены и&nbsp;сроки</>,
    lede: <>Точную цену называю после брифа, она не&nbsp;меняется по&nbsp;ходу работы, если не&nbsp;меняется задача.</>,
    firstTag: "Первые пять проектов",
    first: <>Цены ниже обычных, а&nbsp;взамен отзыв и&nbsp;разрешение показать сайт в&nbsp;портфолио.</>,
    from: "от",
    discuss: "Обсудить",
    promises: [
      ["Гарантия", <>Если прототип главной не&nbsp;понравится, верну предоплату целиком.</>],
      ["Оплата", <>По&nbsp;договору: предоплата 30–50&nbsp;%, остаток после запуска.</>],
      [<>Хостинг и&nbsp;домен</>, <>Покупаются на&nbsp;ваше имя и&nbsp;оплачиваются отдельно, обычно 3–6&nbsp;тысяч рублей в&nbsp;год.</>],
    ] as [React.ReactNode, React.ReactNode][],
  },
  en: {
    title: <>Pricing and timelines</>,
    lede: <>I give an exact price after the brief, and it doesn’t change during the work unless the task changes.</>,
    firstTag: "First five projects",
    first: <>Prices are lower than usual; in&nbsp;return I ask for a&nbsp;review and permission to show the site in&nbsp;my portfolio.</>,
    from: "from",
    discuss: "Discuss",
    promises: [
      ["Guarantee", <>If you don’t like the homepage prototype, I&nbsp;refund the prepayment in&nbsp;full.</>],
      ["Payment", <>Under a&nbsp;contract: 30–50&nbsp;% upfront, the rest after launch.</>],
      ["Hosting and domain", <>Bought in&nbsp;your name and paid separately, usually $40–80 a&nbsp;year.</>],
    ] as [React.ReactNode, React.ReactNode][],
  },
};

export function Prices({ lang }: { lang: Lang }) {
  const t = text[lang];
  const plans = lang === "en" ? plansEn : plansRu;
  const fix = lang === "en" ? (x: string) => x : nb;
  // 15000 → «15 000» с неразрывным пробелом, 300 → «300»
  const money = (n: number) => n.toLocaleString(lang === "en" ? "en-US" : "ru-RU").replace(/\s/g, "\u00a0");
  return (
    <section className={`${s.prices} wrap`} aria-labelledby="prices-title">
      <div className={s.head}>
        <h1 id="prices-title" className={s.title} data-g-rise="">
          {t.title}
        </h1>
        <p className={s.lede}>
          {t.lede}
        </p>
        <p className={s.first}>
          <span className="tag caps">{t.firstTag}</span>
          <span>{t.first}</span>
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
              <p className={`${s.fit} muted`}>{fix(p.fit)}</p>
            </div>
            <p className={s.price}>
              <span className={`${s.from} caps muted`}>{t.from}</span>
              <span className={s.num}>
                {lang === "en" && <span className={s.rub}>$</span>}
                {money(p.from)}
                {lang === "ru" && <span className={s.rub}>&nbsp;₽</span>}
              </span>
              <span className={`${s.usual} muted`}>{fix(p.usual)}</span>
            </p>
            <div className={s.rest}>
              <ul className={s.list}>
                {p.items.map((it) => (
                  <li key={it}>{fix(it)}</li>
                ))}
              </ul>
              <Link className={`${s.go} caps link`} href={href(lang, `/contact/?type=${encodeURIComponent(p.value)}`)} prefetch={false}>
                {t.discuss}
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
        {t.promises.map(([k, v], n) => (
          <li key={n} data-reveal style={n ? ({ "--reveal-i": n } as React.CSSProperties) : undefined}>
            <span className="caps">{k}</span>
            <span>{v}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
