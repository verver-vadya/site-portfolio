import type { MetadataRoute } from "next";
import { getCases } from "@/lib/cases";
import { absolute } from "@/lib/paths";
import { SITE_ORIGIN } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "works/", "prices/", "about/", "contact/", "privacy/"];
  return [
    ...pages.map((p) => ({ url: absolute(SITE_ORIGIN, p) })),
    ...getCases().map((c) => ({ url: absolute(SITE_ORIGIN, `cases/${c.slug}/`) })),
  ];
}
