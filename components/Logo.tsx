import { MARK_BOTTOM, MARK_TOP, WORD_PATH } from "@/lib/brand";
import s from "./Logo.module.css";

// Знак и надпись одним SVG: цвет берётся от текста (currentColor), верх ромба полупрозрачный.
// mark — только ромб (аватарка, иконка), word — только надпись.
// team — знак «Объединения»: ромб раскладывается на несколько ромбов, когда у предка есть
// data-team-on (шапка на странице /collective/). Варианты раскладки — в TEAM ниже.
export type TeamVariant = keyof typeof TEAM;

export function Logo({
  variant = "full",
  className,
  team,
}: {
  variant?: "full" | "mark" | "word";
  className?: string;
  team?: TeamVariant;
}) {
  const mark = team ? <TeamMark variant={team} /> : <Mark />;
  if (variant === "mark") {
    return (
      <svg className={className} viewBox="-50 -50 100 100" overflow="visible" aria-hidden="true" focusable="false">
        {mark}
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
    <svg className={className} viewBox="40 40 5288 862" overflow="visible" aria-hidden="true" focusable="false">
      <g transform="translate(471 471) scale(8.28)">{mark}</g>
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

// Плитка — тот же ромб, сдвинутый (x, y в единицах знака шириной 100) и уменьшенный (s), с прозрачностью o.
// Первая плитка видна и в покое (это обычный знак), остальные появляются из-под неё.
// s0 — размер в покое: 0, если плитка вылетает из центра.
type Tile = { x: number; y: number; s: number; o?: number; s0?: number };
const TEAM = {
  // «Трое»: ромб уменьшается, по бокам из-под него выходят ещё два, полупрозрачные
  a: [
    { x: 0, y: 0, s: 0.48 },
    { x: -27, y: 0, s: 0.46, o: 0.5 },
    { x: 27, y: 0, s: 0.46, o: 0.5 },
  ],
  // «Мозаика»: ромб распадается на четыре ромба поменьше, вместе они держат ту же форму
  b: [
    { x: 0, y: 25, s: 0.46 },
    { x: 0, y: -25, s: 0.46 },
    { x: -25, y: 0, s: 0.46 },
    { x: 25, y: 0, s: 0.46 },
  ],
  // «Искры»: ромб чуть сжимается, из него вылетают три маленьких ромба, как искры со страницы
  c: [
    { x: -6, y: 0, s: 0.8 },
    { x: 38, y: -30, s: 0.16, s0: 0 },
    { x: 47, y: 6, s: 0.12, s0: 0 },
    { x: 33, y: 32, s: 0.2, s0: 0 },
  ],
} satisfies Record<string, Tile[]>;

function TeamMark({ variant }: { variant: TeamVariant }) {
  const tiles: Tile[] = TEAM[variant];
  // главную плитку рисуем последней, чтобы она лежала сверху
  return (
    <>
      {tiles
        .map((t, i) => (
          <g
            key={i}
            className={s.tile}
            data-main={i === 0 || undefined}
            style={
              {
                "--x": t.x,
                "--y": t.y,
                "--s": t.s,
                "--o": t.o ?? 1,
                "--s0": t.s0 ?? 1,
                "--i": i,
              } as React.CSSProperties
            }
          >
            <Mark />
          </g>
        ))
        .reverse()}
    </>
  );
}
