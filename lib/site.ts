// Данные о владельце сайта: заполнить один раз здесь, они попадут в «Обо мне», заявку,
// подвал и политику конфиденциальности.
export const owner = {
  name: "Вадим", // как подписываться: «Отвечу я, Вадим»
  fullName: "Мачихин Вадим Андреевич", // для подвала и политики конфиденциальности
  status: "самозанятый", // или «ИП»
  inn: "511702630968",
  telegram: "notverver", // без @
  channel: "ververcompany", // Telegram-канал, без @
  email: "verver.company@mail.ru",
  formspree: "meaezpda", // номер формы из адреса https://formspree.io/f/номер (см. README «Заявки»)
  // то же для английской версии сайта
  en: { name: "Vadim", fullName: "Vadim Machikhin", status: "self-employed" },
};

// имя, полное имя и статус на нужном языке
export const ownerIn = (lang: "ru" | "en") =>
  lang === "en" ? owner.en : { name: owner.name, fullName: owner.fullName, status: owner.status };

// Адрес сайта для canonical, sitemap и превью в мессенджерах (без / в конце)
export const SITE_ORIGIN = "https://verver-vadya.github.io";
