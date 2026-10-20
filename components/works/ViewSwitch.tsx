"use client";
// «Компьютер / Телефон»: ставит data-view на ближайший блок с работами, карточки меняют скриншот сами (CSS).
// Смена волной (GSAP): по карточкам слева направо старый скриншот уходит вверх и гаснет,
// новый поднимается на его место. Потом стили GSAP убираются, и дальше снова работает CSS.
import { useRef, useState } from "react";
import { dur, ease, gsap } from "@/lib/gsap";

export function ViewSwitch({ labels }: { labels: { view: string; desktop: string; phone: string } }) {
  const views = [
    ["desktop", labels.desktop],
    ["phone", labels.phone],
  ] as const;
  const [view, setView] = useState<string>("desktop");
  const wave = useRef<gsap.core.Timeline | null>(null);

  const swap = (box: HTMLElement, to: string) => {
    const from = box.dataset.view;
    wave.current?.progress(1).kill();
    if (from === to || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      box.dataset.view = to;
      return;
    }
    const shots = box.querySelectorAll<HTMLElement>("[data-shot]");
    const cards = Array.from(box.querySelectorAll<HTMLElement>("[data-g-cards] > *"));
    // пока идёт волна, CSS-переходы скриншотов выключены, а видимость задаёт GSAP
    gsap.set(shots, { transition: "none" });
    box.querySelectorAll(`[data-shot="${from}"]`).forEach((el) => gsap.set(el, { opacity: 1 }));
    box.querySelectorAll(`[data-shot="${to}"]`).forEach((el) => gsap.set(el, { opacity: 0 }));
    box.dataset.view = to;
    const tl = gsap.timeline({ onComplete: () => gsap.set(shots, { clearProps: "transition,opacity,transform" }) });
    cards.forEach((card, i) => {
      const t = i * 0.06;
      tl.to(card.querySelector(`[data-shot="${from}"]`), { opacity: 0, y: -14, scale: 0.97, duration: dur.close, ease: ease.close }, t);
      tl.fromTo(
        card.querySelector(`[data-shot="${to}"]`),
        { opacity: 0, y: 28, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: ease.soft },
        t + 0.12
      );
    });
    wave.current = tl;
  };

  return (
    <div className="switch caps" role="group" aria-label={labels.view}>
      {views.map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={view === v}
          onClick={(e) => {
            const box = e.currentTarget.closest<HTMLElement>("[data-view]");
            if (box) swap(box, v);
            setView(v);
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
