import { getCollection } from "astro:content";

// Все кейсы по порядку: поле order, потом год (новые выше)
export async function getCases() {
  const all = await getCollection("cases");
  return all.sort((a, b) => a.data.order - b.data.order || b.data.year - a.data.year);
}

export const statusLabel = { concept: "Концепт", client: "Заказ" } as const;

// Путь внутри сайта с учётом base (/site-portfolio/)
export const href = (p = "") => `${import.meta.env.BASE_URL.replace(/\/$/, "")}/${p}`;
