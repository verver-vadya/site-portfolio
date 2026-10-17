// Общие подписи интерфейса на двух языках. Тексты страниц лежат рядом с самими страницами.
import type { Lang } from "./i18n";

const ru = {
  skip: "Перейти к содержимому",
  nav: {
    label: "Разделы",
    home: "verver, на главную",
    works: "Работы",
    prices: "Цены",
    about: "Обо мне",
    contact: "Связаться",
    menu: "Меню",
  },
  lang: { label: "Язык сайта", other: "EN", otherFull: "English" },
  footer: { privacy: "Политика конфиденциальности", inn: "ИНН" },
  theme: { label: "Тема сайта", title: "Тема:", dark: "Тёмная", light: "Светлая", system: "Как в системе" },
  cta: {
    eyebrow: "Дальше",
    title: "Расскажите о задаче, отвечу в течение дня",
    button: "Оставить заявку",
    prices: "Цены и сроки",
    about: "Обо мне",
    works: "Работы",
    allWorks: "Все работы",
  },
  hero: {
    title: "Сайты под задачу бизнеса: от брифа до запуска",
    lede: "Дизайн, вёрстка, формы и онлайн-запись. Сайт, хостинг и домен оформляются на владельца.",
    hintScene: "Листайте: работы поднимутся из воды",
    hintPlain: "Работы ниже",
  },
  stage: {
    label: "Работы на кольце",
    mouse: "Тяните кольцо, чтобы покрутить, нажмите на экран, чтобы открыть",
    touch: "Листайте кольцо пальцем, нажмите на экран, чтобы открыть",
    work: (i: number, title: string) => `Работа ${i}: ${title}`,
    of: (i: number, n: number) => `Работа ${i} из ${n}`,
    prev: "Предыдущая работа",
    next: "Следующая работа",
    open: "Открыть работу",
  },
  works: {
    title: "Работы",
    view: "Какой экран показать",
    desktop: "Компьютер",
    phone: "Телефон",
  },
  status: { concept: "Концепт", client: "Заказ" },
  cursorOpen: "Открыть",
  photo: (name: string) => `Фото: ${name}`,
  copy: { copy: "Скопировать", done: "Скопировано", mail: "Скопировать почту" },
  back: {
    back: "← Назад",
    home: " на главную",
    works: " к работам",
    case: " к работе",
    prices: " к ценам",
  },
};

export type Dict = typeof ru;

const en: Dict = {
  skip: "Skip to content",
  nav: {
    label: "Sections",
    home: "verver, home page",
    works: "Work",
    prices: "Pricing",
    about: "About",
    contact: "Contact",
    menu: "Menu",
  },
  lang: { label: "Site language", other: "RU", otherFull: "Русский" },
  footer: { privacy: "Privacy policy", inn: "Tax ID" },
  theme: { label: "Site theme", title: "Theme:", dark: "Dark", light: "Light", system: "System" },
  cta: {
    eyebrow: "Next",
    title: "Tell me about your project, I’ll reply within a day",
    button: "Send a request",
    prices: "Pricing",
    about: "About",
    works: "Work",
    allWorks: "All work",
  },
  hero: {
    title: "Websites built around your business: from brief to launch",
    lede: "Design, development, forms and online booking. The site, hosting and domain are registered to you.",
    hintScene: "Scroll: the work rises from the water",
    hintPlain: "Work below",
  },
  stage: {
    label: "Work on the ring",
    mouse: "Drag the ring to spin it, click a screen to open it",
    touch: "Swipe the ring to spin it, tap a screen to open it",
    work: (i, title) => `Project ${i}: ${title}`,
    of: (i, n) => `Project ${i} of ${n}`,
    prev: "Previous project",
    next: "Next project",
    open: "Open project",
  },
  works: {
    title: "Work",
    view: "Which screen to show",
    desktop: "Desktop",
    phone: "Phone",
  },
  status: { concept: "Concept", client: "Client" },
  cursorOpen: "Open",
  photo: (name) => `Photo: ${name}`,
  copy: { copy: "Copy", done: "Copied", mail: "Copy email" },
  back: {
    back: "← Back",
    home: " to home",
    works: " to work",
    case: " to the project",
    prices: " to pricing",
  },
};

export const dict: Record<Lang, Dict> = { ru, en };
