import { PrivacyView } from "@/components/views/PrivacyView";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Privacy policy · verver",
  description: "What data the request form receives, why, and how to ask for it to be deleted.",
  path: "/privacy/",
  lang: "en",
});

export default function PrivacyPage() {
  return <PrivacyView lang="en" />;
}
