// Сайт собирается в статические файлы (папка dist) и живёт на GitHub Pages по адресу /site-portfolio/.
// На своём домене: BASE_PATH="/" при сборке, тогда адреса начинаются с корня.
import type { NextConfig } from "next";
import { execSync } from "node:child_process";

const raw = process.env.BASE_PATH ?? "/site-portfolio";
const basePath = raw === "/" ? "" : raw.replace(/\/$/, "");

// Метка версии в каждой странице (<meta name="build">): после публикации сверяем её с нужным коммитом
let build = process.env.GITHUB_SHA ?? "";
if (!build) {
  try {
    build = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    build = "local";
  }
}

const config: NextConfig = {
  output: "export",
  distDir: process.env.DIST_DIR ?? "dist", // DIST_DIR — отдельная папка для пробной сборки
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_BUILD: build.slice(0, 12),
  },
  // SKIP_TSC=1: пробная сборка, пока соседние файлы ещё в работе (обычная сборка проверяет типы)
  typescript: { ignoreBuildErrors: process.env.SKIP_TSC === "1" },
  reactStrictMode: true,
  devIndicators: false,
  poweredByHeader: false,
};

export default config;
