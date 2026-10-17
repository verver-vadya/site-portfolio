import { Cta } from "@/components/Cta";
import { Faq } from "@/components/prices/Faq";
import { Prices } from "@/components/prices/Prices";
import { dict } from "@/lib/dict";
import { href, type Lang } from "@/lib/i18n";

export function PricesView({ lang }: { lang: Lang }) {
  const t = dict[lang].cta;
  return (
    <>
      <Prices lang={lang} />
      <Faq lang={lang} />
      <Cta
        lang={lang}
        links={[
          { label: t.works, to: href(lang, "/works/") },
          { label: t.about, to: href(lang, "/about/") },
        ]}
      />
    </>
  );
}
