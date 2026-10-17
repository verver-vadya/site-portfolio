import { CaseView } from "@/components/views/CaseView";
import { getCase, getCases } from "@/lib/cases";
import { pageMeta } from "@/lib/meta";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCases().map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const c = getCase(slug);
  if (!c) return {};
  return pageMeta({
    title: `${c.title} — ${c.niche.toLowerCase()} · verver`,
    description: c.summary,
    path: `/cases/${c.slug}/`,
    image: `img/cases/${c.slug}/og.jpg`, // делает scripts/images.mjs: JPEG 1200×630, его понимают все мессенджеры
  });
}

export default async function CasePage({ params }: Props) {
  const { slug } = await params;
  return <CaseView slug={slug} lang="ru" />;
}
