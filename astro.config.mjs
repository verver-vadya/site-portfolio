// Превью живёт на GitHub Pages по адресу /site-portfolio/.
// На своём домене: site = "https://домен", base убрать.
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://verver-vadya.github.io",
  // BASE_PATH задают сборки: GitHub Pages (адрес репозитория) и автопроверка ("/")
  base: process.env.BASE_PATH ?? "/site-portfolio",
  trailingSlash: "always",
  build: { format: "directory" },
  devToolbar: { enabled: false },
});
