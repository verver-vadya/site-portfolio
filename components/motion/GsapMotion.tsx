"use client";
// Движение на GSAP, общее для страниц (страница кейса — components/case/CaseMotion.tsx):
// — заголовки с data-g-rise поднимаются строками из-под края, когда доходят до экрана;
// — карточки работ в списке data-g-cards поднимаются по очереди.
// Пока скрипт не запустился, эти блоки спрятаны в CSS (globals.css), reveal-all показывает всё.
// При выключенных в системе анимациях всё только проявляется.
import { usePathname } from "next/navigation";
import { SplitText } from "gsap/SplitText";
import { dur, ease, gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

gsap.registerPlugin(SplitText);

export function GsapMotion() {
  const pathname = usePathname();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        { full: "(prefers-reduced-motion: no-preference)", calm: "(prefers-reduced-motion: reduce)" },
        (ctx) => {
          const { full } = ctx.conditions as { full: boolean };
          const at = (t: Element) => ({ trigger: t, start: "top 92%", once: true });

          document.querySelectorAll<HTMLElement>("[data-g-rise]").forEach((h) => {
            if (!full) {
              gsap.fromTo(h, { opacity: 0 }, { opacity: 1, duration: dur.open, ease: ease.close, scrollTrigger: at(h) });
            } else {
              SplitText.create(h, {
                type: "lines",
                mask: "lines",
                linesClass: "g-line",
                autoSplit: true,
                onSplit: (self) => {
                  gsap.set(h, { opacity: 1 });
                  return gsap.fromTo(
                    self.lines,
                    { yPercent: 110 },
                    { yPercent: 0, duration: 0.9, ease: ease.soft, stagger: 0.08, delay: 0.1, scrollTrigger: at(h) }
                  );
                },
              });
            }
            h.classList.add("is-in");
          });

          document.querySelectorAll<HTMLElement>("[data-g-cards]").forEach((list) => {
            const cards = Array.from(list.children);
            gsap.set(cards, full ? { opacity: 0, y: 48 } : { opacity: 0 });
            list.classList.add("is-in");
            ScrollTrigger.batch(cards, {
              start: "top 92%",
              once: true,
              onEnter: (batch) =>
                gsap.to(batch, {
                  opacity: 1,
                  y: 0,
                  duration: full ? 0.9 : dur.open,
                  ease: full ? ease.soft : ease.close,
                  stagger: 0.08,
                  clearProps: "transform",
                }),
            });
          });
        }
      );
    },
    { dependencies: [pathname], revertOnUpdate: true }
  );

  return null;
}
