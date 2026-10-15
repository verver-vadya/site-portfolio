// Заголовок, описание, canonical и превью для мессенджеров у каждой страницы
import type { Metadata } from "next";
import { absolute } from "./paths";
import { SITE_ORIGIN } from "./site";

export function pageMeta({
  title,
  description,
  path,
  image = "og.jpg",
}: {
  title: string;
  description: string;
  path: string; // "/works/"
  image?: string; // путь внутри сайта, без ведущего /
}): Metadata {
  const url = absolute(SITE_ORIGIN, path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      siteName: "verver",
      title,
      description,
      url,
      images: [{ url: absolute(SITE_ORIGIN, image) }],
    },
  };
}
