import { CollectiveView } from "@/components/views/CollectiveView";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Collective · verver",
  description: "A team for each project: design, 3D and motion, development, photo and copy. One contract and one person in charge.",
  path: "/collective/",
  image: "og-collective-en.jpg",
  lang: "en",
});

export default function CollectivePage() {
  return <CollectiveView lang="en" />;
}
