// Кейсы портфолио: одна папка = один кейс в src/content/cases/<папка>/
// index.md (поля ниже + текст «Задача» и «Решение») и скриншоты рядом.
// Новый кейс: npm run case -- <папка> <адрес сайта>
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const cases = defineCollection({
  loader: glob({ pattern: "*/index.md", base: "./src/content/cases" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      niche: z.string(),
      city: z.string(),
      year: z.number(),
      status: z.enum(["concept", "client"]),
      url: z.string().url(),
      live: z.boolean().default(true),
      order: z.number().default(10),
      summary: z.string(),
      tagline: z.string().optional(), // подпись под карточкой: одна фраза с характером
      term: z.string().optional(), // срок и повод: «два дня», «за неделю до открытия»
      desktop: z.array(image()).min(1),
      phone: z.array(image()).min(1),
    }),
});

export const collections = { cases };
