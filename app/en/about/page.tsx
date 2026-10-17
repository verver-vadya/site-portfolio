import { AboutView } from "@/components/views/AboutView";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "About · verver",
  description: "Who builds the sites, what the work includes and how to reach me.",
  path: "/about/",
  lang: "en",
});

export default function AboutPage() {
  return <AboutView lang="en" />;
}
