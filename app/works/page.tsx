import { Works } from "@/components/works/Works";
import { Cta } from "@/components/Cta";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Работы · verver",
  description: "Сайты, которые я сделал: задача, решение, скриншоты на компьютере и телефоне.",
  path: "/works/",
});

export default function WorksPage() {
  return (
    <>
      <Works level={1} />
      <div style={{ position: "relative", zIndex: 1, background: "var(--c-paper)" }}>
        <Cta
          links={[
            { label: "Цены и сроки", to: "/prices/" },
            { label: "Обо мне", to: "/about/" },
          ]}
        />
      </div>
    </>
  );
}
