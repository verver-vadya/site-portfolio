import { About } from "@/components/about/About";
import { Cta } from "@/components/Cta";
import { dict } from "@/lib/dict";
import { href, type Lang } from "@/lib/i18n";

export function AboutView({ lang }: { lang: Lang }) {
  const t = dict[lang].cta;
  return (
    <>
      <About lang={lang} />
      <Cta
        lang={lang}
        links={[
          { label: t.works, to: href(lang, "/works/") },
          { label: t.prices, to: href(lang, "/prices/") },
        ]}
      />
    </>
  );
}
