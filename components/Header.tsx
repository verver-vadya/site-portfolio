"use client";
// Шапка прилипает к верху: при прокрутке вниз уезжает, при прокрутке вверх возвращается.
// Текущий раздел подчёркнут (у «Работ» ещё и страницы кейсов).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { dict } from "@/lib/dict";
import { href, langOf, stripLang } from "@/lib/i18n";
import { Logo, type TeamVariant } from "./Logo";
import { MobileMenuLazy } from "./MobileMenuLazy";
import s from "./Header.module.css";

type Section = { to: string; key: "works" | "prices" | "about" | "collective" | "contact"; also?: string; narrow?: boolean };
const sections: Section[] = [
  { to: "/works/", key: "works", also: "/cases/" },
  { to: "/prices/", key: "prices" },
  { to: "/about/", key: "about", narrow: true },
  { to: "/collective/", key: "collective" },
  { to: "/contact/", key: "contact" },
];

export function Header() {
  const full = usePathname() || "/";
  const lang = langOf(full);
  const path = stripLang(full); // раздел без /en
  const t = dict[lang];
  const other = lang === "en" ? "ru" : "en";
  // на странице 404 у адреса нет пары на другом языке: ведём на главную
  const known = /^\/((works|prices|about|contact|privacy|collective)\/?|cases\/[^/]+\/?)?$/.test(path);
  const items = sections.map((it) => ({ ...it, label: t.nav[it.key], href: href(lang, it.to) }));
  const ref = useRef<HTMLElement>(null);
  // на странице «Объединения» знак раскладывается на несколько ромбов (components/Logo.tsx)
  const team = /^\/collective\/?$/.test(path);
  // пока выбираем раскладку: ?mark=a|b|c
  const [teamVariant, setTeamVariant] = useState<TeamVariant>("b");
  useEffect(() => {
    const v = new URLSearchParams(location.search).get("mark");
    if (v === "a" || v === "b" || v === "c") setTeamVariant(v);
  }, []);

  // язык страницы для экранных дикторов и переводчика браузера (переход между языками идёт без перезагрузки)
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const header = ref.current;
    if (!header) return;
    let last = Math.max(0, scrollY);
    let ticking = false;
    const update = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      const y = Math.min(Math.max(0, scrollY), max); // без отскока iOS у краёв
      const dy = y - last;
      const h = header.offsetHeight;
      if (y <= h) {
        header.classList.remove(s.hidden, s.floating);
      } else if (dy > 6) {
        header.classList.add(s.hidden);
      } else if (dy < -6) {
        header.classList.remove(s.hidden);
        header.classList.add(s.floating);
      } else return; // мелкое дрожание пальца не считаем
      last = y;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => removeEventListener("scroll", onScroll);
  }, []);

  // после перехода на другую страницу шапка снова видна
  useEffect(() => {
    ref.current?.classList.remove(s.hidden);
  }, [path]);

  return (
    <header ref={ref} className={s.header} data-header>
      <div className={`${s.in} wrap`}>
        <Link className={s.mark} href={href(lang, "/")} aria-label={t.nav.home} data-team-on={team || undefined}>
          <Logo className={s.full} team={teamVariant} />
          <Logo variant="mark" className={s.short} team={teamVariant} />
        </Link>
        <div className={s.right}>
          <nav className={s.nav} aria-label={t.nav.label}>
            <ul className={`${s.list} caps`}>
              {items.map((it) => {
                const here = path === it.to;
                const inside = here || path.startsWith(it.to) || (it.also ? path.startsWith(it.also) : false);
                return (
                  <li key={it.to} className={it.narrow ? s.narrow : undefined}>
                    <Link
                      className={`link ${s.item}${inside ? ` ${s.here}` : ""}`}
                      href={it.href}
                      aria-current={here ? "page" : undefined}
                    >
                      {it.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <Link
            className={`${s.lang} caps link`}
            href={href(other, known ? path : "/")}
            hrefLang={other}
            lang={other}
            aria-label={t.lang.otherFull}
            title={t.lang.otherFull}
          >
            {t.lang.other}
          </Link>
          <MobileMenuLazy
            label={t.nav.menu}
            items={items.map((it) => ({ to: it.href, label: it.label, here: path === it.to }))}
          />
        </div>
      </div>
    </header>
  );
}
