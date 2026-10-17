"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { dict, type Dict } from "@/lib/dict";
import { langOf } from "@/lib/i18n";
import { withBase } from "@/lib/paths";

// «← Назад» на странице заявки: видна, только если человек пришёл с другой страницы сайта.
// Подпись говорит, куда вернёмся; нажатие идёт по истории, чтобы та страница открылась на том же месте.
// Переходы внутри сайта не меняют document.referrer, поэтому прошлую страницу берём из Navigation API,
// а без него — из referrer, и только если эта страница загружена целиком.

type NavEntry = { url: string | null; index: number };
type Nav = { currentEntry: NavEntry | null; entries: () => NavEntry[] };

function previousUrl(): URL | null {
  try {
    const nav = (window as unknown as { navigation?: Nav }).navigation;
    if (nav?.currentEntry) {
      const prev = nav.entries()[nav.currentEntry.index - 1];
      return prev?.url ? new URL(prev.url) : null;
    }
    const entry = performance.getEntriesByType("navigation")[0];
    const landedHere = entry && new URL(entry.name).pathname === location.pathname;
    return landedHere && document.referrer ? new URL(document.referrer) : null;
  } catch {
    return null;
  }
}

function label(path: string, t: Dict["back"]) {
  path = path.replace(/^en(\/|$)/, "");
  if (path === "" || path === "index.html") return t.home;
  if (path.startsWith("works/")) return t.works;
  if (path.startsWith("cases/")) return t.case;
  if (path.startsWith("prices/")) return t.prices;
  return "";
}

export function BackLink({ className }: { className?: string }) {
  const t = dict[langOf(usePathname())].back;
  const [back, setBack] = useState<{ href: string; text: string } | null>(null);

  useEffect(() => {
    const base = withBase("");
    const from = previousUrl();
    if (!from || from.origin !== location.origin || !from.pathname.startsWith(base) || from.pathname === location.pathname) return;
    setBack({ href: from.href, text: `${t.back}${label(from.pathname.slice(base.length), t)}` });
  }, [t]);

  return (
    <a
      // без ромб-шторки: ссылка идёт назад по истории, и страница открывается там, где её оставили
      data-no-curtain
      className={`${className ?? ""} caps link`}
      href={back?.href ?? withBase("")}
      hidden={!back}
      onClick={(e) => {
        if (history.length > 1) {
          e.preventDefault();
          history.back();
        }
      }}
    >
      {back?.text ?? t.back}
    </a>
  );
}
