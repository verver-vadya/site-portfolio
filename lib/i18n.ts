// Два языка: русский по обычным адресам, английский — те же страницы под /en/.
// Пути здесь без адреса превью (BASE_PATH): next/link и usePathname работают так же.
export type Lang = "ru" | "en";

export const langOf = (path: string | null | undefined): Lang => (/^\/en(\/|$)/.test(path ?? "") ? "en" : "ru");

// путь без /en: «/en/works/» → «/works/», «/en» → «/»
export const stripLang = (path: string) => path.replace(/^\/en(?=\/|$)/, "") || "/";

// путь страницы на нужном языке: href("en", "/works/") → «/en/works/»
export const href = (lang: Lang, path: string) => (lang === "en" ? `/en${path}` : path);

// главная на любом языке
export const isHome = (path: string | null | undefined) => {
  const p = stripLang(path ?? "/");
  return p === "/" || p === "";
};
