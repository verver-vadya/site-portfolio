// Картинки кейсов для сайта: из content/cases/<папка>/*.jpg делает WebP нужных ширин
// в public/img/cases/<папка>/ и список размеров public/img/manifest.json.
// Запускается сам перед `npm run dev` и `npm run build`; готовые файлы не пересобирает.
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const SRC = path.resolve("content/cases");
const OUT = path.resolve("public/img/cases");
const MANIFEST = path.resolve("public/img/manifest.json");

// Ширины: экраны компьютера и телефона. Больше исходника не растягиваем.
const WIDTHS = { desktop: [640, 960, 1440, 2160], phone: [260, 390, 520, 780] };
const QUALITY = 80;

const manifest = {};
const slugs = (await fs.readdir(SRC, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);

for (const slug of slugs) {
  const files = (await fs.readdir(path.join(SRC, slug))).filter((f) => /^(desktop|phone)-\d+\.(jpe?g|png|webp)$/i.test(f));
  await fs.mkdir(path.join(OUT, slug), { recursive: true });
  for (const file of files.sort()) {
    const src = path.join(SRC, slug, file);
    const name = file.replace(/\.\w+$/, "");
    const kind = name.startsWith("phone") ? "phone" : "desktop";
    const meta = await sharp(src).metadata();
    const widths = [...new Set(WIDTHS[kind].map((w) => Math.min(w, meta.width)))];
    const srcTime = (await fs.stat(src)).mtimeMs;
    for (const w of widths) {
      const out = path.join(OUT, slug, `${name}-${w}.webp`);
      const done = await fs.stat(out).then((s) => s.mtimeMs >= srcTime, () => false);
      if (!done) await sharp(src).resize({ width: w }).webp({ quality: QUALITY }).toFile(out);
    }
    manifest[`${slug}/${name}`] = { width: meta.width, height: meta.height, widths };
  }
}

await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`картинки кейсов: ${Object.keys(manifest).length} шт. в public/img/cases`);
