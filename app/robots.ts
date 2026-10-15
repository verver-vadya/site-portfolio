import type { MetadataRoute } from "next";
import { absolute } from "@/lib/paths";
import { SITE_ORIGIN } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absolute(SITE_ORIGIN, "sitemap.xml"),
  };
}
