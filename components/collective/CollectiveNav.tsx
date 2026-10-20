"use client";

// Плавающая панель-«таблетка» страницы «Объединение» и ярлык «Открытые роли» на правом краю.
// Появляются, когда первый экран почти пролистан, и прячутся, когда дошли до подвала,
// чтобы не закрывать его ссылки. Пока спрятаны, они inert: Tab по ним не ходит.
// Подсвечен раздел, который сейчас на середине экрана.
// Ссылки на разделы едут плавно: на компьютере это делает Lenis (anchors), на телефоне браузер.

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import s from "./CollectiveNav.module.css";

const text = {
  ru: { label: "Разделы страницы", clients: "Клиентам", roles: "Роли", join: "Вступить", open: "Открытые роли" },
  en: { label: "Page sections", clients: "For clients", roles: "Roles", join: "Join", open: "Open roles" },
};

const SECTIONS = ["clients", "join", "join-form"] as const;

export function CollectiveNav({ lang, open }: { lang: Lang; open: number }) {
  const t = text[lang];
  const [shown, setShown] = useState(false);
  const [current, setCurrent] = useState<string>("");

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const footer = document.querySelector("footer");
      const nearFooter = footer ? footer.getBoundingClientRect().top < innerHeight - 24 : false;
      setShown(scrollY > innerHeight * 0.55 && !nearFooter);
      let now = "";
      for (const id of SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < innerHeight / 2) now = id;
      }
      setCurrent(now);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
    };
  }, []);

  // без Lenis (телефон) браузер прыгнул бы к якорю: едем плавно сами
  const go = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (document.documentElement.classList.contains("lenis")) return;
    const target = document.querySelector(e.currentTarget.hash);
    if (!target) return;
    e.preventDefault();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const link = (id: string, label: string, cls = "") => (
    <a href={`#${id}`} className={`${s.item} ${cls}`} aria-current={current === id ? "location" : undefined} onClick={go}>
      {label}
    </a>
  );

  return (
    <>
      <nav className={`${s.nav} caps`} aria-label={t.label} data-shown={shown || undefined} inert={!shown}>
        {link("clients", t.clients)}
        {link("join", t.roles)}
        {link("join-form", t.join, s.inverse)}
      </nav>
      <a className={`${s.tab} caps`} href="#join" data-shown={shown || undefined} inert={!shown} onClick={go}>
        {t.open} · {open}
      </a>
    </>
  );
}
