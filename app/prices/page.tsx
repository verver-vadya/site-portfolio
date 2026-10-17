import { PricesView } from "@/components/views/PricesView";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Цены и сроки · verver",
  description:
    "Лендинг от 15 000 ₽, сайт-визитка от 25 000 ₽, сайт с записью или каталогом от 45 000 ₽. Сроки, оплата, гарантия и ответы на вопросы.",
  path: "/prices/",
});

export default function PricesPage() {
  return <PricesView lang="ru" />;
}
