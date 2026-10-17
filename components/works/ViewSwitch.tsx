"use client";
// «Компьютер / Телефон»: ставит data-view на ближайший блок с работами, карточки меняют скриншот сами (CSS)
import { useState } from "react";

export function ViewSwitch({ labels }: { labels: { view: string; desktop: string; phone: string } }) {
  const views = [
    ["desktop", labels.desktop],
    ["phone", labels.phone],
  ] as const;
  const [view, setView] = useState<string>("desktop");
  return (
    <div className="switch caps" role="group" aria-label={labels.view}>
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
