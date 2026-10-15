// Список картинок кейсов с размерами (его пишет scripts/images.mjs перед сборкой).
// Только для серверных компонентов: читает файл при сборке.
import "server-only";
import fs from "node:fs";
import path from "node:path";
import { withBase } from "./paths";

type Entry = { width: number; height: number; widths: number[] };
let cache: Record<string, Entry> | null = null;

function manifest() {
  if (!cache) {
    const file = path.join(process.cwd(), "public/img/manifest.json");
    cache = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, Entry>;
  }
  return cache;
}

export type Img = {
  id: string; // "kare/desktop-1"
  width: number;
  height: number;
  src: string; // средний размер для src
  srcSet: string;
  widths: { w: number; url: string }[];
};

// id вида "kare/desktop-1" → адреса WebP разных ширин
export function img(id: string): Img {
  const e = manifest()[id];
  if (!e) throw new Error(`Нет картинки ${id}: запустите node scripts/images.mjs`);
  const widths = e.widths.map((w) => ({ w, url: withBase(`img/cases/${id}-${w}.webp`) }));
  const mid = widths[Math.min(1, widths.length - 1)];
  return {
    id,
    width: e.width,
    height: e.height,
    src: mid.url,
    srcSet: widths.map((x) => `${x.url} ${x.w}w`).join(", "),
    widths,
  };
}
