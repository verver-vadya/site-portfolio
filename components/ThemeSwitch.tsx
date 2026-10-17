"use client";
// Тема сайта: тёмная по умолчанию, светлая или как в системе. Выбор запоминается в браузере,
// а до отрисовки его ставит скрипт в <head> (app/layout.tsx), чтобы страница не мигала.
import { useEffect, useState } from "react";
import { MorphIcon } from "morphicons/react";
import type { Dict } from "@/lib/dict";
import { monitor, moon, sun } from "@/lib/icons";
import s from "./Footer.module.css";

type Choice = "dark" | "light" | "system";
const options: Choice[] = ["dark", "light", "system"];
const COLOR = { dark: "#0b0b0c", light: "#ffffff" } as const;
const lightQuery = () => matchMedia("(prefers-color-scheme: light)");

function read(): Choice {
  try {
    const t = localStorage.getItem("theme");
    if (t === "light" || t === "system") return t;
  } catch {}
  return "dark";
}

function paint(choice: Choice) {
  const root = document.documentElement;
  const theme = choice === "system" ? (lightQuery().matches ? "light" : "dark") : choice;
  if (root.dataset.theme !== theme) {
    root.classList.add("is-theme-switching");
    root.dataset.theme = theme;
    // переходы включаются обратно после того, как новые цвета отрисованы
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("is-theme-switching")));
  }
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", COLOR[theme]);
}

export function ThemeSwitch({ t }: { t: Dict["theme"] }) {
  // null до чтения выбора: иначе на миг красили бы тёмную тему поверх светлой, выставленной скриптом в <head>
  const [choice, setChoice] = useState<Choice | null>(null);

  useEffect(() => {
    setChoice(read());
  }, []);

  useEffect(() => {
    if (!choice) return;
    paint(choice);
    if (choice !== "system") return;
    const q = lightQuery();
    const onChange = () => paint("system");
    q.addEventListener("change", onChange);
    return () => q.removeEventListener("change", onChange);
  }, [choice]);

  const pick = (value: Choice) => {
    try {
      if (value === "dark") localStorage.removeItem("theme");
      else localStorage.setItem("theme", value);
    } catch {}
    setChoice(value);
  };

  return (
    <div className={s.theme} role="group" aria-label={t.label}>
      {/* иконка перетекает в выбранную тему: луна, солнце или экран */}
      <MorphIcon
        className={s.themeIcon}
        icon={choice === "light" ? sun : choice === "system" ? monitor : moon}
        size={18}
        strokeWidth={1.6}
        spring="smooth"
        reducedMotion="user"
      />
      <span>{t.title}</span>
      {options.map((o) => (
        <button
          key={o}
          className={s.themeBtn}
          type="button"
          aria-pressed={choice === o}
          onClick={() => pick(o)}
        >
          {t[o]}
        </button>
      ))}
    </div>
  );
}
