// Пути с учётом адреса превью (/site-portfolio). next/link добавляет его сам,
// а обычным <img>, <a href> на файлы и текстурам WebGL нужен withBase().
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const withBase = (p = "") => `${BASE_PATH}/${p.replace(/^\//, "")}`;

// Полный адрес страницы для canonical и Open Graph
export const absolute = (origin: string, p = "") => `${origin}${withBase(p)}`;
