"use client";
// Меню Bloom тянет за собой framer-motion (~48 КБ). Грузим его только на телефоне, когда
// страница уже открылась; до этого на месте кнопки такой же кружок без движения.
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import s from "./MobileMenu.module.css";

type Item = { to: string; label: string; here: boolean };

const Bloom = dynamic(() => import("./MobileMenu").then((m) => m.MobileMenu), {
  ssr: false,
  loading: () => <Placeholder />,
});

function Placeholder() {
  return (
    <div className={s.menu}>
      <span className={`${s.box} ${s.stub}`} aria-hidden="true">
        <svg viewBox="0 0 20 20">
          <path d="M3.5 7h13M3.5 13h13" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </span>
    </div>
  );
}

export function MobileMenuLazy({ items }: { items: Item[] }) {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(max-width: 560px)");
    const check = () => setPhone(mq.matches);
    check();
    mq.addEventListener("change", check);
    return () => mq.removeEventListener("change", check);
  }, []);
  return phone ? <Bloom items={items} /> : <Placeholder />;
}
