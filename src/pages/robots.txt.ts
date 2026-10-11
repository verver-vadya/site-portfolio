import type { APIRoute } from "astro";
import { href } from "../scripts/cases";

export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL(href("sitemap.xml"), site).href}\n`, {
    headers: { "Content-Type": "text/plain" },
  });
