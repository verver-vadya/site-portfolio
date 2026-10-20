import type { Lang } from "@/lib/i18n";

// Роли в объединении: одни и те же в разделе для клиентов, в открытых ролях и в форме вступления.
// open — набираем ли сейчас людей на эту роль (счётчик «Открытые роли» считает только их).
export type Role = { id: string; name: string; about: string; open: boolean };

const ru: Role[] = [
  { id: "design", name: "Интерфейсы и дизайн", about: "Структура, макеты, дизайн-система и мелкие детали интерфейса.", open: true },
  { id: "motion", name: "3D и анимация", about: "Сцены на WebGL, модели и плавное движение на странице.", open: true },
  { id: "front", name: "Фронтенд", about: "Вёрстка на Astro и Next.js, скорость загрузки и доступность.", open: true },
  { id: "back", name: "Бэкенд и оплаты", about: "Запись, личные кабинеты, приём оплаты, серверы в России.", open: true },
  { id: "photo", name: "Фото и видео", about: "Съёмка места и людей, короткие ролики для первого экрана.", open: true },
  { id: "copy", name: "Тексты", about: "Понятные тексты страниц, заголовки и описания услуг.", open: true },
];

const en: Role[] = [
  { id: "design", name: "Interfaces and design", about: "Structure, layouts, a design system and the small details of an interface.", open: true },
  { id: "motion", name: "3D and motion", about: "WebGL scenes, models and smooth movement on the page.", open: true },
  { id: "front", name: "Front end", about: "Astro and Next.js builds, loading speed and accessibility.", open: true },
  { id: "back", name: "Back end and payments", about: "Booking, client accounts, payments and servers in the right country.", open: true },
  { id: "photo", name: "Photo and video", about: "Shooting the place and the people, short clips for the first screen.", open: true },
  { id: "copy", name: "Copy", about: "Clear page copy, headlines and service descriptions.", open: true },
];

export const roles = { ru, en } satisfies Record<Lang, Role[]>;
export const openRoles = (lang: Lang) => roles[lang].filter((r) => r.open);
