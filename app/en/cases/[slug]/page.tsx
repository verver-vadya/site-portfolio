import { CaseView } from "@/components/views/CaseView";
import { getCase, getCases } from "@/lib/cases";
import { pageMeta } from "@/lib/meta";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCases("en").map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const c = getCase(slug, "en");
  if (!c) return {};
  return pageMeta({
    title: `${c.title} — ${c.niche.toLowerCase()} · verver`,
    description: c.summary,
    path: `/cases/${c.slug}/`,
    image: `img/cases/${c.slug}/og.jpg`,
    lang: "en",
  });
}

export default async function CasePage({ params }: Props) {
  const { slug } = await params;
  return <CaseView slug={slug} lang="en" />;
}
