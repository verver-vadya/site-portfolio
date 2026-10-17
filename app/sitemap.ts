import type { MetadataRoute } from "next";
import { getCases } from "@/lib/cases";
import { absolute } from "@/lib/paths";
import { SITE_ORIGIN } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "works/", "prices/", "about/", "contact/", "privacy/"];
  const all = [...pages, ...getCases().map((c) => `cases/${c.slug}/`)];
  // каждая страница есть на русском и под /en/ на английском
  return [...all, ...all.map((p) => `en/${p}`)].map((p) => ({ url: absolute(SITE_ORIGIN, p) }));
}
