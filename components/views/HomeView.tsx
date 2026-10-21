import { Cta } from "@/components/Cta";
import { Hero } from "@/components/home/Hero";
import { Stage } from "@/components/home/Stage";
import { Works } from "@/components/works/Works";
import { getCases } from "@/lib/cases";
import { dict } from "@/lib/dict";
import { href, type Lang } from "@/lib/i18n";
import s from "@/app/page.module.css";

export function HomeView({ lang }: { lang: Lang }) {
  const t = dict[lang];
  const cases = getCases(lang);
  return (
    <>
      <Hero lang={lang} />
      <Stage
        lang={lang}
        cases={cases.map((c) => ({
          slug: c.slug,
          title: c.title,
          meta: `${c.niche} · ${c.city} · ${c.year} · ${t.status[c.status]}`,
          tagline: c.tagline,
          phone: c.phone[0],
        }))}
      />
      {/* дальше страница наезжает на сцену и закрывает её */}
      <div className={s.after} data-scene-after>
        <Works level={2} lang={lang} />
        <Cta
          lang={lang}
          links={[
            { label: t.cta.prices, to: href(lang, "/prices/") },
            { label: t.cta.about, to: href(lang, "/about/") },
          ]}
        />
      </div>
    </>
  );
}
