// Посмотреть собранный сайт: npm run build, потом npm run preview → http://localhost:4321/
// Сайт должен быть собран с корнем "/" (BASE_PATH=/ npm run build), как в автопроверке.
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(process.env.DIST_DIR ?? "dist");
const PORT = Number(process.env.PORT ?? 4321);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
};

async function file(p) {
  const stat = await fs.stat(p).catch(() => null);
  if (stat?.isDirectory()) return file(path.join(p, "index.html"));
  return stat ? p : null;
}

http
  .createServer(async (req, res) => {
    const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const target = path.join(ROOT, url);
    const found = target.startsWith(ROOT) ? await file(target) : null;
    const send = found ?? path.join(ROOT, "404.html");
    res.writeHead(found ? 200 : 404, { "content-type": TYPES[path.extname(send)] ?? "application/octet-stream" });
    res.end(await fs.readFile(send));
  })
  .listen(PORT, () => console.log(`сайт из ${path.relative(process.cwd(), ROOT)}: http://localhost:${PORT}/`));
