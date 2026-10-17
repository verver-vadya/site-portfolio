import { PrivacyView } from "@/components/views/PrivacyView";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Политика конфиденциальности · verver",
  description: "Какие данные получает форма заявки, зачем и как попросить их удалить.",
  path: "/privacy/",
});

export default function PrivacyPage() {
  return <PrivacyView lang="ru" />;
}
