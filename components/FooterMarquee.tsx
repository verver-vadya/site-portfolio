"use client";
// Бегущая строка над подвалом: «Обсудим ваш проект», вся строка — ссылка на заявку.
// Едет медленно справа налево; когда страницу листают, разгоняется и плавно возвращается
// к своей скорости. Под курсором замедляется. Вне экрана стоит.
// При выключенных в системе анимациях строка стоит на месте.
import Link from "next/link";
import { useRef } from "react";
import { ease, gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import s from "./FooterMarquee.module.css";

const SPEED = 70; // px в секунду в покое
const COPIES = 4; // в каждой из двух половин ленты: хватает на широкий экран

export function FooterMarquee({ text, to }: { text: string; to: string }) {
  const root = useRef<HTMLAnchorElement>(null);
  const track = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const el = track.current!;
        let loop = null as gsap.core.Tween | null;
        const build = () => {
          const half = el.scrollWidth / 2;
          const scale = loop?.timeScale() ?? 1;
          const at = loop ? loop.progress() : 0;
          loop?.kill();
          loop = gsap.fromTo(el, { x: 0 }, { x: -half, duration: half / SPEED, ease: "none", repeat: -1 });
          loop.progress(at).timeScale(scale);
        };
        build();
        const ro = new ResizeObserver(build);
        ro.observe(el);

        let hover = false;
        const rest = () => (hover ? 0.3 : 1);
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => loop?.paused(!self.isActive),
          onUpdate: (self) => {
            if (!loop) return;
            const boost = Math.min(5, 1 + Math.abs(self.getVelocity()) / 350);
            gsap.to(loop, {
              timeScale: Math.max(boost, rest()),
              duration: 0.2,
              ease: ease.close,
              overwrite: true,
              onComplete: () => void gsap.to(loop, { timeScale: rest(), duration: 1.2, ease: ease.soft }),
            });
          },
        });
        loop?.paused(!st.isActive);

        const a = root.current!;
        const enter = () => {
          hover = true;
          if (loop) gsap.to(loop, { timeScale: rest(), duration: 0.6, ease: ease.hover, overwrite: true });
        };
        const leave = () => {
          hover = false;
          if (loop) gsap.to(loop, { timeScale: rest(), duration: 0.6, ease: ease.hover, overwrite: true });
        };
        a.addEventListener("pointerenter", enter);
        a.addEventListener("pointerleave", leave);
        return () => {
          ro.disconnect();
          a.removeEventListener("pointerenter", enter);
          a.removeEventListener("pointerleave", leave);
          loop?.kill();
        };
      });
    },
    { scope: root }
  );

  const half = (hidden: boolean) => (
    <span className={s.half} aria-hidden={hidden || undefined}>
      {Array.from({ length: COPIES }, (_, i) => (
        <span key={i} className={s.item} aria-hidden={(!hidden && i > 0) || undefined}>
          {text}
          <span className={s.mark} />
        </span>
      ))}
    </span>
  );

  return (
    <Link ref={root} className={s.marquee} href={to} aria-label={text}>
      <span ref={track} className={s.track}>
        {half(false)}
        {half(true)}
      </span>
    </Link>
  );
}
