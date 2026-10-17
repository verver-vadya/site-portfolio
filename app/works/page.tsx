import { WorksView } from "@/components/views/WorksView";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Работы · verver",
  description: "Сайты, которые я сделал: задача, решение, скриншоты на компьютере и телефоне.",
  path: "/works/",
});

export default function WorksPage() {
  return <WorksView lang="ru" />;
}
