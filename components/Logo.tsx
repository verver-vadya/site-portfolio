import { MARK_BOTTOM, MARK_TOP, WORD_PATH } from "@/lib/brand";

// Знак и надпись одним SVG: цвет берётся от текста (currentColor), верх ромба полупрозрачный.
// mark — только ромб (аватарка, иконка), word — только надпись.
export function Logo({ variant = "full", className }: { variant?: "full" | "mark" | "word"; className?: string }) {
  if (variant === "mark") {
    return (
      <svg className={className} viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">
        <Mark />
      </svg>
    );
  }
  if (variant === "word") {
    return (
      <svg className={className} viewBox="1 -588 4097 604" aria-hidden="true" focusable="false">
        <path d={WORD_PATH} fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="40 40 5288 862" aria-hidden="true" focusable="false">
      <g transform="translate(471 471) scale(8.28)">
        <Mark />
      </g>
      <path transform="translate(1199 756.6)" d={WORD_PATH} fill="currentColor" />
    </svg>
  );
}

function Mark() {
  return (
    <>
      <polygon points={MARK_TOP} fill="currentColor" style={{ fillOpacity: "var(--mark-top)" }} />
      <polygon points={MARK_BOTTOM} fill="currentColor" />
    </>
  );
}
