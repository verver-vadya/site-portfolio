import type { Metadata, Viewport } from "next";
import { Onest, Unbounded } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Intro, introScript } from "@/components/motion/Intro";
import { Motion } from "@/components/motion/Motion";
import { SceneRoot } from "@/components/scene/SceneRoot";
import { BASE_PATH } from "@/lib/paths";
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

// До первой отрисовки: тема из переключателя (тёмная по умолчанию), метка js для проявления блоков
// и страховка: если скрипты сайта не загрузились за 3 с, всё показывается сразу
const themeScript = `(function(){var d=document.documentElement;d.classList.add("js");try{var t=localStorage.getItem("theme");
var l=t==="light"||(t==="system"&&matchMedia("(prefers-color-scheme: light)").matches);d.dataset.theme=l?"light":"dark";}catch(e){}
setTimeout(function(){if(!window.__motion)d.classList.add("reveal-all")},3000)})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-theme="dark" className={`${display.variable} ${text.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript + introScript(`${BASE_PATH}/`) }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Перейти к содержимому
        </a>
        <Header />
        <SceneRoot />
        <main id="main">{children}</main>
        <Footer />
        <Intro />
        <Motion />
      </body>
    </html>
  );
}
