import { CollectiveView } from "@/components/views/CollectiveView";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Объединение · verver",
  description: "Команда под проект: дизайн, 3D и анимация, разработка, фото и тексты. Один договор и один ответственный.",
  path: "/collective/",
  image: "og-collective.jpg",
});

export default function CollectivePage() {
  return <CollectiveView lang="ru" />;
}
