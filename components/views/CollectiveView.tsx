import { Clients } from "@/components/collective/Clients";
import { CollectiveHero } from "@/components/collective/CollectiveHero";
import { CollectiveNav } from "@/components/collective/CollectiveNav";
import { Join } from "@/components/collective/Join";
import { openRoles } from "@/components/collective/roles";
import type { Lang } from "@/lib/i18n";

export function CollectiveView({ lang }: { lang: Lang }) {
  return (
    <>
      <CollectiveHero lang={lang} />
      <Clients lang={lang} />
      <Join lang={lang} />
      <CollectiveNav lang={lang} open={openRoles(lang).length} />
    </>
  );
}
