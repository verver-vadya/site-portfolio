"use client";
// Шапка прилипает к верху: при прокрутке вниз уезжает, при прокрутке вверх возвращается.
// Текущий раздел подчёркнут (у «Работ» ещё и страницы кейсов).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Logo } from "./Logo";
import s from "./Header.module.css";

const items = [
  { to: "/works/", label: "Работы", also: "/cases/" },
  { to: "/prices/", label: "Цены" },
  { to: "/about/", label: "Обо мне", narrow: true },
  { to: "/contact/", label: "Связаться" },
];

export function Header() {
  const path = usePathname() || "/";
  const ref = useRef<HTMLElement>(null);

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
        <Link className={s.mark} href="/" aria-label="verver, на главную">
          <Logo className={s.full} />
          <Logo variant="mark" className={s.short} />
        </Link>
        <nav aria-label="Разделы">
          <ul className={`${s.list} caps`}>
            {items.map((it) => {
              const here = path === it.to;
              const inside = here || path.startsWith(it.to) || (it.also ? path.startsWith(it.also) : false);
              return (
                <li key={it.to} className={it.narrow ? s.narrow : undefined}>
                  <Link
                    className={`link ${s.item}${inside ? ` ${s.here}` : ""}`}
                    href={it.to}
                    aria-current={here ? "page" : undefined}
                  >
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
