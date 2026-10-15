"use client";
// «Компьютер / Телефон»: ставит data-view на ближайший блок с работами, карточки меняют скриншот сами (CSS)
import { useState } from "react";

const views = [
  ["desktop", "Компьютер"],
  ["phone", "Телефон"],
] as const;

export function ViewSwitch() {
  const [view, setView] = useState<string>("desktop");
  return (
    <div className="switch caps" role="group" aria-label="Какой экран показать">
      {views.map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={view === v}
          onClick={(e) => {
            const box = e.currentTarget.closest<HTMLElement>("[data-view]");
            if (box) box.dataset.view = v;
            setView(v);
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
