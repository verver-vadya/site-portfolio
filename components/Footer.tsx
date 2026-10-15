import Link from "next/link";
import { owner } from "@/lib/site";
import { ThemeSwitch } from "./ThemeSwitch";
import s from "./Footer.module.css";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={s.footer}>
      <div className={`${s.in} wrap caps muted`}>
        <span>© verver, {year}</span>
        <span>
          {owner.fullName}, {owner.status}, ИНН {owner.inn}
        </span>
        <ThemeSwitch />
        <Link className={`link ${s.link}`} href="/privacy/">
          Политика конфиденциальности
        </Link>
      </div>
    </footer>
  );
}
