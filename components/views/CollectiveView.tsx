import { CollectiveHero } from "@/components/collective/CollectiveHero";
import type { Lang } from "@/lib/i18n";

export function CollectiveView({ lang }: { lang: Lang }) {
  return <CollectiveHero lang={lang} />;
}
