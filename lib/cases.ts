// Кейсы портфолио: одна папка = один кейс в content/cases/<папка>/
// index.md (поля ниже + текст «Задача» и «Решение») и скриншоты рядом.
// Новый кейс: npm run case -- <папка> <адрес сайта>
import "server-only";
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { marked } from "marked";
import { img, type Img } from "./images";

const DIR = path.join(process.cwd(), "content/cases");

export type CaseStatus = "concept" | "client";
export const statusLabel: Record<CaseStatus, string> = { concept: "Концепт", client: "Заказ" };

export type Case = {
  slug: string;
  title: string;
  niche: string;
  city: string;
  year: number;
  status: CaseStatus;
  url: string;
  live: boolean;
  order: number;
  summary: string;
  tagline?: string; // подпись под карточкой: одна фраза с характером
  term?: string; // срок и повод: «два дня», «за неделю до открытия»
  desktop: Img[];
  phone: Img[];
  html: string; // «Задача» и «Решение» из index.md
};

function fail(slug: string, msg: string): never {
  throw new Error(`content/cases/${slug}/index.md: ${msg}`);
}

function read(slug: string): Case {
  const raw = fs.readFileSync(path.join(DIR, slug, "index.md"), "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) fail(slug, "нет блока полей между ---");
  const d = parse(m[1]) as Record<string, unknown>;
  const str = (k: string, required = true) => {
    const v = d[k];
    if (v == null || v === "") {
      if (required) fail(slug, `нет поля ${k}`);
      return undefined;
    }
    return String(v);
  };
  const shots = (k: "desktop" | "phone") => {
    const list = d[k];
    if (!Array.isArray(list) || !list.length) fail(slug, `нет скриншотов в поле ${k}`);
    return list.map((f) => img(`${slug}/${String(f).replace(/^\.\//, "").replace(/\.\w+$/, "")}`));
  };
  const status = str("status") as CaseStatus;
  if (status !== "concept" && status !== "client") fail(slug, "status: concept или client");
  return {
    slug,
    title: str("title")!,
    niche: str("niche")!,
    city: str("city")!,
    year: Number(d.year),
    status,
    url: str("url")!,
    live: d.live !== false,
    order: Number(d.order ?? 10),
    summary: str("summary")!,
    tagline: str("tagline", false),
    term: str("term", false),
    desktop: shots("desktop"),
    phone: shots("phone"),
    html: marked.parse(m[2], { async: false }) as string,
  };
}

let cache: Case[] | null = null;

// Все кейсы по порядку: поле order, потом год (новые выше)
export function getCases(): Case[] {
  if (!cache) {
    const slugs = fs
      .readdirSync(DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory() && fs.existsSync(path.join(DIR, e.name, "index.md")))
      .map((e) => e.name);
    cache = slugs.map(read).sort((a, b) => a.order - b.order || b.year - a.year);
  }
  return cache;
}

export function getCase(slug: string) {
  return getCases().find((c) => c.slug === slug);
}
