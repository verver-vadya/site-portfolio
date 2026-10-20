"use client";
// Движение страницы кейса на GSAP (lib/gsap.ts). Только transform и opacity.
// Открытие страницы: скриншот на первом экране чуть приближен и медленно отъезжает к своему кадру,
// «Все работы», название (строки выезжают из-под края), подпись и кнопка появляются по очереди.
// Если страница открылась из кольца (панель раскрылась в этот экран, класс case-handoff),
// первый экран не трогаем: кадр уже совпал с панелью, подпись проявляет сама страница.
// Прокрутка: скриншот первого экрана отстаёт от страницы и немного приближается;
// ниже текст поднимается строками и блоками, скриншоты поднимаются на плашках
// и отъезжают от лёгкого приближения в такт прокрутке (назад тоже).
// При выключенных в системе анимациях всё только проявляется.
import { useRef } from "react";
import { SplitText } from "gsap/SplitText";
import { dur, ease, gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

gsap.registerPlugin(SplitText);

const ON = "is-in"; // после него CSS больше не прячет блоки до запуска скрипта

export function CaseMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const hero = q("[data-case-hero]")[0] as HTMLElement | undefined;
      const body = q("[data-case-body]")[0] as HTMLElement | undefined;
      const handoff = document.documentElement.classList.contains("case-handoff");
      const mm = gsap.matchMedia();

      mm.add(
        { full: "(prefers-reduced-motion: no-preference)", calm: "(prefers-reduced-motion: reduce)" },
        (ctx) => {
          const { full } = ctx.conditions as { full: boolean };

          // ---------- первый экран при открытии ----------
          if (hero && !handoff) {
            const pic = hero.querySelector("[data-g-hero-pic]");
            const items = hero.querySelectorAll("[data-g-hero]");
            const title = hero.querySelector("[data-g-title]");
            // у подписи свои CSS-переходы для раскрытия из кольца: на время появления выключаем,
            // потом убираем все стили GSAP, и ховеры работают как раньше
            gsap.set(items, { transition: "none" });
            const tl = gsap.timeline({
              defaults: { ease: ease.soft },
              onComplete: () => gsap.set(items, { clearProps: "transition,opacity,transform" }),
            });
            if (full) {
              if (pic) tl.fromTo(pic, { scale: 1.1 }, { scale: 1, duration: 1.6 }, 0);
              tl.fromTo(items, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: dur.reveal, stagger: 0.08 }, 0.2);
              if (title) {
                SplitText.create(title, {
                  type: "lines",
                  mask: "lines",
                  linesClass: "g-line",
                  autoSplit: true,
                  onSplit: (self) => {
                    gsap.set(title, { opacity: 1 });
                    return gsap.fromTo(self.lines, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: ease.soft, stagger: 0.08, delay: 0.28 });
                  },
                });
              }
            } else {
              tl.fromTo([...items, title].filter(Boolean), { opacity: 0 }, { opacity: 1, duration: dur.open, ease: ease.close }, 0);
            }
          }
          hero?.classList.add(ON);

          // ---------- первый экран при прокрутке ----------
          if (hero && full) {
            const frame = hero.querySelector("[data-g-hero-frame]");
            const text = hero.querySelector("[data-g-hero-text]");
            const scrub = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
            if (frame) gsap.fromTo(frame, { yPercent: 0, scale: 1 }, { yPercent: 18, scale: 1.08, ease: "none", scrollTrigger: scrub });
            if (text) gsap.fromTo(text, { y: 0, opacity: 1 }, { y: -60, opacity: 0, ease: "none", scrollTrigger: { ...scrub, end: "60% top" } });
          }

          // ---------- всё ниже ----------
          if (body) {
            const at = (t: Element, start = "top 88%") => ({ trigger: t, start, once: true });
            const up = full ? { y: 32 } : {};
            const upTo = full ? { y: 0 } : {};
            const d = full ? dur.reveal : dur.open;
            const e = full ? ease.soft : ease.close;

            // описание поднимается строками
            body.querySelectorAll("[data-g-lines]").forEach((t) => {
              if (!full) return void gsap.fromTo(t, { opacity: 0 }, { opacity: 1, duration: d, ease: e, scrollTrigger: at(t) });
              gsap.set(t, { opacity: 1 });
              SplitText.create(t, {
                type: "lines",
                mask: "lines",
                linesClass: "g-line",
                autoSplit: true,
                onSplit: (self) =>
                  gsap.fromTo(self.lines, { yPercent: 105 }, { yPercent: 0, duration: 0.9, ease: e, stagger: 0.06, scrollTrigger: at(t) }),
              });
            });

            // факты и абзацы: по одному, группами, когда доходят до экрана
            const pieces = body.querySelectorAll("[data-g-each] > *");
            gsap.set(pieces, { opacity: 0, ...up });
            ScrollTrigger.batch(pieces, {
              start: "top 90%",
              once: true,
              onEnter: (batch) => gsap.to(batch, { opacity: 1, ...upTo, duration: d, ease: e, stagger: 0.06 }),
            });

            // блоки целиком: плашки со скриншотами, телефоны, следующая работа
            body.querySelectorAll("[data-g-block]").forEach((b) => {
              gsap.fromTo(b, { opacity: 0, ...(full ? { y: 56 } : {}) }, { opacity: 1, ...upTo, duration: full ? 1 : d, ease: e, scrollTrigger: at(b) });
            });
            body.querySelectorAll("[data-g-phones]").forEach((list) => {
              gsap.fromTo(
                list.children,
                { opacity: 0, ...(full ? { y: 64 } : {}) },
                { opacity: 1, ...upTo, duration: full ? 1 : d, ease: e, stagger: 0.1, scrollTrigger: at(list) }
              );
            });

            // скриншот отъезжает от приближения, пока плашка идёт от низа экрана к середине
            if (full) {
              body.querySelectorAll("[data-g-zoom]").forEach((img) => {
                gsap.fromTo(
                  img,
                  { scale: 1.06 },
                  { scale: 1, ease: "none", scrollTrigger: { trigger: img, start: "top bottom", end: "center center", scrub: true } }
                );
              });
            }
            body.classList.add(ON);
          }

          // картинки ниже грузятся лениво и меняют высоту страницы: точки срабатывания пересчитываются
          const refresh = () => ScrollTrigger.refresh();
          const imgs = Array.from(el.querySelectorAll("img")).filter((i) => !i.complete);
          imgs.forEach((i) => i.addEventListener("load", refresh, { once: true }));
          return () => imgs.forEach((i) => i.removeEventListener("load", refresh));
        }
      );
    },
    { scope: root }
  );

  return (
    <div ref={root} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
