"use client";
// Меню на телефоне (Bloom): круглая кнопка в шапке сама перетекает в список разделов.
// На компьютере разделы стоят в шапке строкой, это меню скрыто.
import { Menu } from "bloom-menu";
import Link from "next/link";
import { useState } from "react";
import s from "./MobileMenu.module.css";

type Item = { to: string; label: string; here: boolean };

export function MobileMenu({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={s.menu}>
      <Menu.Root open={open} onOpenChange={setOpen} direction="bottom" anchor="end" visualDuration={0.5} bounce={0.1}>
        <Menu.Container className={s.box} buttonSize={44} menuWidth={220} menuRadius={20}>
          <Menu.Trigger className={s.trigger}>
            <span className="visually-hidden">Меню</span>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M3.5 7h13M3.5 13h13" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </Menu.Trigger>
          <Menu.Content className={`${s.list} caps`}>
            {items.map((it) => (
              <Menu.Item key={it.to} className={s.item}>
                <Link href={it.to} className={s.link} aria-current={it.here ? "page" : undefined}>
                  {it.label}
                </Link>
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Container>
      </Menu.Root>
    </div>
  );
}
