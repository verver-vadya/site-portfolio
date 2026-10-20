"use client";
// GSAP сайта: подключаем один раз и берём отсюда, а не из "gsap" напрямую.
// Кривые — наши токены движения (setup/motion-examples.md в файлах проекта), а не встроенные
// power1/power2: "soft" открытие и появление, "close" закрытие, "hover" крупное наведение,
// "quick" только мелочи до 200 мс. Отскоков (back, elastic, bounce) не используем.
// ScrollTrigger и useGSAP подключены сразу; другие плагины регистрируем там, где они нужны.
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(CustomEase, ScrollTrigger, useGSAP);

export const ease = {
  soft: CustomEase.create("soft", "0.35,0,0.15,1"),
  close: CustomEase.create("close", "0.4,0,0.2,1"),
  hover: CustomEase.create("hover", "0.45,0,0.25,1"),
  quick: CustomEase.create("quick", "0.23,1,0.32,1"),
};

// длительности в секундах, как в токенах CSS
export const dur = { press: 0.16, small: 0.2, hover: 0.6, open: 0.5, close: 0.32, reveal: 0.7, stagger: 0.05 };

gsap.defaults({ ease: "soft", duration: dur.open });

// На компьютере прокрутку ведёт Lenis (components/motion/Motion.tsx), он двигает настоящую прокрутку
// окна, и ScrollTrigger её видит. Когда появится первая анимация на ScrollTrigger, свяжем их, чтобы
// не было отставания на кадр: lenis.on("scroll", ScrollTrigger.update)
export { gsap, ScrollTrigger, useGSAP };
