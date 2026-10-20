import { Clients } from "@/components/collective/Clients";
import { CollectiveHero } from "@/components/collective/CollectiveHero";
import { CollectiveNav } from "@/components/collective/CollectiveNav";
import { Join } from "@/components/collective/Join";
import { openRoles } from "@/components/collective/roles";
import { Sparks } from "@/components/collective/Sparks";
import s from "@/components/collective/CollectivePage.module.css";
import type { Lang } from "@/lib/i18n";

export function CollectiveView({ lang }: { lang: Lang }) {
  return (
    <div className={s.page}>
      {/* искры — фон под текстом, наложение задумано */}
      <div className={s.layer} aria-hidden="true" data-overlap-ok="">
        <Sparks className={s.sparks} />
      </div>
      <CollectiveHero lang={lang} />
      <Clients lang={lang} />
      <Join lang={lang} />
      <CollectiveNav lang={lang} open={openRoles(lang).length} />
    </div>
  );
}
