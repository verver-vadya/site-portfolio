import { ContactView } from "@/components/views/ContactView";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Заявка · verver",
  description: "Расскажите о задаче: четыре вопроса, пара минут. Отвечу в течение дня.",
  path: "/contact/",
});

export default function ContactPage() {
  return <ContactView lang="ru" />;
}
