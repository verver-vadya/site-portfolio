// Иконки Lucide (лицензия ISC) для Morphicons: одна иконка плавно перетекает в другую.
import type { IconNode } from "morphicons/react";

export const sun: IconNode = [
  ["circle", { cx: 12, cy: 12, r: 4 }],
  ["path", { d: "M12 2v2" }],
  ["path", { d: "M12 20v2" }],
  ["path", { d: "m4.93 4.93 1.41 1.41" }],
  ["path", { d: "m17.66 17.66 1.41 1.41" }],
  ["path", { d: "M2 12h2" }],
  ["path", { d: "M20 12h2" }],
  ["path", { d: "m6.34 17.66-1.41 1.41" }],
  ["path", { d: "m19.07 4.93-1.41 1.41" }],
];
export const moon: IconNode = [["path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" }]];
export const monitor: IconNode = [
  ["rect", { width: 20, height: 14, x: 2, y: 3, rx: 2 }],
  ["line", { x1: 8, x2: 16, y1: 21, y2: 21 }],
  ["line", { x1: 12, x2: 12, y1: 17, y2: 21 }],
];
export const copy: IconNode = [
  ["rect", { width: 14, height: 14, x: 8, y: 8, rx: 2, ry: 2 }],
  ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }],
];
export const check: IconNode = [["path", { d: "M20 6 9 17l-5-5" }]];
