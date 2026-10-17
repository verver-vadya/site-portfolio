import { WorksView } from "@/components/views/WorksView";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Work · verver",
  description: "Websites I have made: the task, the solution, screenshots on desktop and phone.",
  path: "/works/",
  lang: "en",
});

export default function WorksPage() {
  return <WorksView lang="en" />;
}
