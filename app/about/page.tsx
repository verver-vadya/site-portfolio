import { AboutView } from "@/components/views/AboutView";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Обо мне · verver",
  description: "Кто делает сайты, что входит в работу и как со мной связаться.",
  path: "/about/",
});

export default function AboutPage() {
  return <AboutView lang="ru" />;
}
