"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { dict } from "@/lib/dict";
import { href, langOf } from "@/lib/i18n";
import { owner, ownerIn } from "@/lib/site";
import { FooterMarquee } from "./FooterMarquee";
import { ThemeSwitch } from "./ThemeSwitch";
import s from "./Footer.module.css";

export function Footer() {
  const pathname = usePathname();
  const lang = langOf(pathname);
  const t = dict[lang];
  const me = ownerIn(lang);
  const year = new Date().getFullYear();
  return (
    <footer className={s.footer}>
      {/* на странице заявки строка вела бы на саму себя */}
      {!/\/contact\/?$/.test(pathname) && <FooterMarquee text={t.footer.marquee} to={href(lang, "/contact/")} />}
      <div className={`${s.in} wrap caps muted`}>
        <span>© verver, {year}</span>
        <span>
          {me.fullName}, {me.status}, {t.footer.inn} {owner.inn}
        </span>
        <span className={s.tg}>
          <a className={`link ${s.link}`} href={`https://t.me/${owner.telegram}`} target="_blank" rel="noopener">
            Telegram
          </a>
          <a className={`link ${s.link}`} href={`https://t.me/${owner.channel}`} target="_blank" rel="noopener">
            {t.footer.channel}
          </a>
        </span>
        <ThemeSwitch t={t.theme} />
        <Link className={`link ${s.link}`} href={href(lang, "/privacy/")}>
          {t.footer.privacy}
        </Link>
      </div>
    </footer>
  );
}
