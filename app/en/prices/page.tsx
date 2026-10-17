import { PricesView } from "@/components/views/PricesView";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Pricing · verver",
  description:
    "Landing page from $300, business site from $500, site with booking or a catalogue from $900. Timelines, payment, guarantee and answers to common questions.",
  path: "/prices/",
  lang: "en",
});

export default function PricesPage() {
  return <PricesView lang="en" />;
}
