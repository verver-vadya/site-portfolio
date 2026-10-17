import { HomeView } from "@/components/views/HomeView";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "verver — websites built around your business",
  description: "Turnkey websites: brief, design, development, forms and booking, launch. Work and contacts.",
  path: "/",
  lang: "en",
});

export default function Home() {
  return <HomeView lang="en" />;
}
