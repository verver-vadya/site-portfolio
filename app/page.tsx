import { Cta } from "@/components/Cta";
import { Hero } from "@/components/home/Hero";
import { Stage } from "@/components/home/Stage";
import { Works } from "@/components/works/Works";
import { getCases, statusLabel } from "@/lib/cases";
import { pageMeta } from "@/lib/meta";
import s from "./page.module.css";

export const metadata = pageMeta({
  title: "verver — сайты под задачу бизнеса",
  description: "Делаю сайты под ключ: бриф, дизайн, вёрстка, формы и запись, запуск. Работы и контакты.",
  path: "/",
});

export default function Home() {
  const cases = getCases();
  return (
    <>
      <Hero />
      <Stage
        cases={cases.map((c) => ({
          slug: c.slug,
          title: c.title,
          meta: `${c.niche} · ${c.city} · ${c.year} · ${statusLabel[c.status]}`,
          tagline: c.tagline,
        }))}
      />
      {/* дальше страница наезжает на сцену и закрывает её */}
      <div className={s.after} data-scene-after>
        <Works level={2} />
        <Cta links={[{ label: "Цены и сроки", to: "/prices/" }, { label: "Обо мне", to: "/about/" }]} />
      </div>
    </>
  );
}
