// Новый кейс в портфолио одной командой:
//   npm run case -- <папка> <адрес сайта>
//   npm run case -- kare https://verver-vadya.github.io/site-kare/
// Снимает по три экрана сайта на компьютере (1440×900) и на телефоне (390×844)
// в content/cases/<папка>/ и, если кейса ещё нет, создаёт index.md с полями для заполнения.
// Повторный запуск обновляет только скриншоты, текст кейса не трогает.
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const [slug, url] = process.argv.slice(2);
if (!slug || !url || !/^[a-z0-9-]+$/.test(slug)) {
  console.error("Как запускать: npm run case -- <папка латиницей> <адрес сайта>");
  process.exit(1);
}

const dir = path.resolve("content/cases", slug);
await fs.mkdir(dir, { recursive: true });

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);

// Три экрана: начало страницы и два места дальше по странице (начала секций, если они есть)
async function shoot(kind, viewport, scale) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: scale });
  // CASE_STORAGE='{"ключ":"значение"}' — записать в localStorage до загрузки (например, чтобы не показывать интро)
  if (process.env.CASE_STORAGE) await page.addInitScript((s) => Object.entries(JSON.parse(s)).forEach(([k, v]) => localStorage.setItem(k, v)), process.env.CASE_STORAGE);
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  // без полосы прокрутки: иначе справа на снимке остаётся пустая полоса
  await page.addStyleTag({ content: "html { scrollbar-width: none; scrollbar-gutter: auto !important; } ::-webkit-scrollbar { display: none; }" });
  await page.waitForTimeout(1500);
  const stops = await page.evaluate((vh) => {
    const max = document.documentElement.scrollHeight - vh;
    const tops = [...document.querySelectorAll("main > section, main > *")]
      .map((el) => Math.round(el.getBoundingClientRect().top + scrollY))
      .filter((y) => y > vh * 0.6 && y < max);
    const pick = (f) => {
      const target = max * f;
      return tops.length ? tops.reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a)) : Math.round(target);
    };
    return [0, pick(0.3), pick(0.65)].map((y) => Math.min(Math.max(0, y), max));
  }, viewport.height);
  for (const [i, y] of stops.entries()) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(1200);
    const file = path.join(dir, `${kind}-${i + 1}.jpg`);
    await page.screenshot({ path: file, type: "jpeg", quality: 86 });
    console.log("  снимок", path.relative(process.cwd(), file));
  }
  await page.close();
}

await shoot("desktop", { width: 1440, height: 900 }, 1.5);
await shoot("phone", { width: 390, height: 844 }, 2);
await browser.close();

const md = path.join(dir, "index.md");
const exists = await fs.access(md).then(() => true, () => false);
if (!exists) {
  const shots = (kind) => [1, 2, 3].map((i) => `  - ./${kind}-${i}.jpg`).join("\n");
  await fs.writeFile(
    md,
    `---
title: "[ЗАПОЛНИТЬ: название]"
niche: "[ЗАПОЛНИТЬ: ниша, кто клиент]"
city: "[ЗАПОЛНИТЬ: город]"
year: ${new Date().getFullYear()}
status: concept # concept — учебная работа, client — настоящий заказ
url: "${url}"
live: true # false, если превью ещё не опубликовано
order: 10 # меньше — выше в списке
summary: "[ЗАПОЛНИТЬ: одна фраза, что за сайт и чем он хорош]"
tagline: "[ЗАПОЛНИТЬ: подпись в каталоге, одна живая фраза, можно с иронией]"
term: "[ЗАПОЛНИТЬ: срок, например «Две недели»]"
desktop:
${shots("desktop")}
phone:
${shots("phone")}
---

## Задача

[ЗАПОЛНИТЬ: кто клиент и что ему было нужно.]

## Решение

[ЗАПОЛНИТЬ: стиль, разделы, что сделано удобным.]
`
  );
  console.log("  создан", path.relative(process.cwd(), md), "— заполните поля с пометкой [ЗАПОЛНИТЬ] (автопроверка не пропустит их на сайт)");
}
