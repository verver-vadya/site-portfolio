import { ContactView } from "@/components/views/ContactView";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Request · verver",
  description: "Tell me about your project: four questions, a couple of minutes. I’ll reply within a day.",
  path: "/contact/",
  lang: "en",
});

export default function ContactPage() {
  return <ContactView lang="en" />;
}
