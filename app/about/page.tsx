import { About } from "@/components/about/About";
import { Cta } from "@/components/Cta";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Обо мне · verver",
  description: "Кто делает сайты, что входит в работу и как со мной связаться.",
  path: "/about/",
});

export default function AboutPage() {
  return (
    <>
      <About />
      <Cta
        links={[
          { label: "Работы", to: "/works/" },
          { label: "Цены и сроки", to: "/prices/" },
        ]}
      />
    </>
  );
}
