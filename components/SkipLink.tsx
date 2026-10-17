"use client";
import { usePathname } from "next/navigation";
import { dict } from "@/lib/dict";
import { langOf } from "@/lib/i18n";

export function SkipLink() {
  return (
    <a className="skip" href="#main">
      {dict[langOf(usePathname())].skip}
    </a>
  );
}
