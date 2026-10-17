// Заголовок, описание, canonical и превью для мессенджеров у каждой страницы.
// path — адрес русской страницы; у английской тот же адрес под /en/, обе ссылаются друг на друга (hreflang).
import type { Metadata } from "next";
import { href, type Lang } from "./i18n";
import { absolute } from "./paths";
import { SITE_ORIGIN } from "./site";

export function pageMeta({
  title,
  description,
  path,
  image = "og.jpg",
  lang = "ru",
}: {
  title: string;
  description: string;
  path: string; // "/works/"
  image?: string; // путь внутри сайта, без ведущего /
  lang?: Lang;
}): Metadata {
  const url = absolute(SITE_ORIGIN, href(lang, path));
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ru: absolute(SITE_ORIGIN, path),
        en: absolute(SITE_ORIGIN, href("en", path)),
        "x-default": absolute(SITE_ORIGIN, path),
      },
    },
    openGraph: {
      type: "website",
      locale: lang === "en" ? "en_US" : "ru_RU",
      siteName: "verver",
      title,
      description,
      url,
      images: [{ url: absolute(SITE_ORIGIN, image) }],
    },
  };
}
