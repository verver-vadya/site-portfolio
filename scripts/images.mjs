// Картинки кейсов для сайта: из content/cases/<папка>/*.jpg делает WebP нужных ширин
// в public/img/cases/<папка>/, превью для мессенджеров og.jpg (1200×630, из первого экрана)
// и список размеров public/img/manifest.json.
// Запускается сам перед `npm run dev` и `npm run build`. Готовый файл пересобирается, только если
// исходник поменялся: у результата то же время изменения, что у исходника, и сравнивается оно.
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
    const srcStat = await fs.stat(src);
    const build = async (out, make) => {
      const done = await fs.stat(out).then((s) => Math.abs(s.mtimeMs - srcStat.mtimeMs) < 1, () => false);
      if (done) return;
      await make(sharp(src)).toFile(out);
      await fs.utimes(out, new Date(), srcStat.mtime);
    };
    for (const w of widths) {
      await build(path.join(OUT, slug, `${name}-${w}.webp`), (img) => img.resize({ width: w }).webp({ quality: QUALITY }));
    }
    if (name === "desktop-1") {
      await build(path.join(OUT, slug, "og.jpg"), (img) =>
        img.resize({ width: 1200, height: 630, fit: "cover", position: "top" }).jpeg({ quality: 82, mozjpeg: true })
      );
    }
    manifest[`${slug}/${name}`] = { width: meta.width, height: meta.height, widths };
  }
}

await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`картинки кейсов: ${Object.keys(manifest).length} шт. в public/img/cases`);
