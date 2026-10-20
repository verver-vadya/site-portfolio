import type { Metadata, Viewport } from "next";
import { Onest, Unbounded } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SkipLink } from "@/components/SkipLink";
import { Intro, introScript } from "@/components/motion/Intro";
import { GsapMotion } from "@/components/motion/GsapMotion";
import { Motion } from "@/components/motion/Motion";
import { DialTune } from "@/components/DialTune";
import { SceneRoot } from "@/components/scene/SceneRoot";
import { getCases } from "@/lib/cases";
import type { Img } from "@/lib/images";
import { BASE_PATH } from "@/lib/paths";
import type { SceneCase } from "@/lib/scene-bus";
import "./globals.css";

// Шрифты скачиваются при сборке и лежат на самом сайте (без запросов к Google у посетителя)
const display = Unbounded({ subsets: ["latin", "cyrillic"], variable: "--font-unbounded", display: "swap" });
const text = Onest({ subsets: ["latin", "cyrillic"], variable: "--font-onest", display: "swap" });

export const metadata: Metadata = {
  title: "verver — сайты под задачу бизнеса",
  description: "Делаю сайты под ключ: бриф, дизайн, вёрстка, формы и запись, запуск. Работы и контакты.",
  other: { build: process.env.NEXT_PUBLIC_BUILD ?? "local" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0b0c",
};

// Высота экрана (--svh, --lvh) замеряется один раз и на телефоне меняется только при повороте:
// иначе Chrome на Android пересчитывает размеры, когда прячется строка поиска.
// Если браузер занизил большой экран, холст один раз дотягивается до настоящей высоты.
// До первой отрисовки: тема из переключателя (тёмная по умолчанию), метка js для проявления блоков
// и страховка: если скрипты сайта не загрузились за 3 с, всё показывается сразу
const themeScript = `(function(){var d=document.documentElement;d.classList.add("js");try{var t=localStorage.getItem("theme");
var l=t==="light"||(t==="system"&&matchMedia("(prefers-color-scheme: light)").matches);d.dataset.theme=l?"light":"dark";}catch(e){}
setTimeout(function(){if(!window.__motion)d.classList.add("reveal-all")},3000)})();
(function(){var d=document.documentElement,w=-1,L=0,touch=matchMedia("(pointer:coarse)").matches;
function m(){if(touch&&innerWidth===w){if(innerHeight>L){L=innerHeight;d.style.setProperty("--lvh",L/100+"px")}return}w=innerWidth;var p=document.createElement("div");
p.style.cssText="position:fixed;top:0;left:0;width:0;visibility:hidden;height:100svh";d.appendChild(p);
var s=p.getBoundingClientRect().height||innerHeight;p.style.height="100lvh";var l=p.getBoundingClientRect().height||innerHeight;
d.removeChild(p);L=Math.max(s,l);d.style.setProperty("--svh",s/100+"px");d.style.setProperty("--lvh",L/100+"px")}
m();addEventListener("resize",m)})();`;

// Язык документа до первой отрисовки: английские страницы лежат под /en/ (разметка общая с русскими)
const langScript = (base: string) =>
  `if(/^\\/en(\\/|$)/.test(location.pathname.slice(${JSON.stringify(base)}.length)))document.documentElement.lang="en";`;

// Для 3D-сцены: скриншоты работ для панелей кольца (средний размер и самый крупный для раскрытия)
function sceneCases(): SceneCase[] {
  const shot = (img: Img, min: number) => ({
    src: img.widths.find((w) => w.w >= min)?.url ?? img.src,
    large: img.widths[img.widths.length - 1].url,
    width: img.width,
    height: img.height,
  });
  return getCases().map((c) => ({
    slug: c.slug,
    title: c.title,
    shots: c.desktop.map((img) => shot(img, 960)),
    phone: c.phone.map((img) => shot(img, 520)),
  }));
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-theme="dark" className={`${display.variable} ${text.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: langScript(BASE_PATH) + themeScript + introScript(BASE_PATH) }} />
      </head>
      <body>
        <SkipLink />
        <Header />
        <SceneRoot cases={sceneCases()} />
        <main id="main">{children}</main>
        <Footer />
        <Intro />
        <Motion />
        <GsapMotion />
        <DialTune />
      </body>
    </html>
  );
}
