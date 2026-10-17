import { Works } from "@/components/works/Works";
import { Cta } from "@/components/Cta";
import { dict } from "@/lib/dict";
import { href, type Lang } from "@/lib/i18n";

export function WorksView({ lang }: { lang: Lang }) {
  const t = dict[lang].cta;
  return (
    <>
      <Works level={1} lang={lang} />
      <div style={{ position: "relative", zIndex: 1, background: "var(--c-paper)" }}>
        <Cta
          lang={lang}
          links={[
            { label: t.prices, to: href(lang, "/prices/") },
            { label: t.about, to: href(lang, "/about/") },
          ]}
        />
      </div>
    </>
  );
}
