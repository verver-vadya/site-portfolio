"use client";
// Кнопка «Скопировать» рядом с почтой: иконка копирования перетекает в галочку (Morphicons),
// через две секунды обратно.
import { MorphIcon } from "morphicons/react";
import { useEffect, useState } from "react";
import { dict } from "@/lib/dict";
import { check, copy } from "@/lib/icons";
import type { Lang } from "@/lib/i18n";
import s from "./CopyButton.module.css";

export function CopyButton({ text, label, lang }: { text: string; label: string; lang: Lang }) {
  const t = dict[lang].copy;
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 2000);
    return () => clearTimeout(t);
  }, [done]);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
    } catch {
      prompt(label, text);
    }
  };
  return (
    <button className={s.btn} type="button" onClick={onClick} aria-label={label}>
      <MorphIcon icon={done ? check : copy} size={18} strokeWidth={1.6} spring="smooth" reducedMotion="user" />
      <span className={s.text} aria-live="polite">
        {done ? t.done : t.copy}
      </span>
    </button>
  );
}
