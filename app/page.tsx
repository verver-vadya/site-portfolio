import { HomeView } from "@/components/views/HomeView";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "verver — сайты под задачу бизнеса",
  description: "Делаю сайты под ключ: бриф, дизайн, вёрстка, формы и запись, запуск. Работы и контакты.",
  path: "/",
});

export default function Home() {
  return <HomeView lang="ru" />;
}
