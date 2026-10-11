import type { APIRoute } from "astro";
import { getCases, href } from "../scripts/cases";

// Карта сайта для поисковиков: главная, разделы и все кейсы
export const GET: APIRoute = async ({ site }) => {
  const cases = await getCases();
  const pages = ["", "works/", "prices/", "about/", "contact/", "privacy/"].map((p) => href(p));
  const urls = [...pages, ...cases.map((c) => href(`cases/${c.id}/`))].map((p) => new URL(p, site).href);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>
`;
  return new Response(body, { headers: { "Content-Type": "application/xml" } });
};
