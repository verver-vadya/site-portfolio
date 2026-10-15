import { Cta } from "@/components/Cta";
import { Faq } from "@/components/prices/Faq";
import { Prices } from "@/components/prices/Prices";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Цены и сроки · verver",
  description:
    "Лендинг от 15 000 ₽, сайт-визитка от 25 000 ₽, сайт с записью или каталогом от 45 000 ₽. Сроки, оплата, гарантия и ответы на вопросы.",
  path: "/prices/",
});

export default function PricesPage() {
  return (
    <>
      <Prices />
      <Faq />
      <Cta
        links={[
          { label: "Работы", to: "/works/" },
          { label: "Обо мне", to: "/about/" },
        ]}
      />
    </>
  );
}
