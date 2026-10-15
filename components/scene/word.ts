// Надпись verver из контуров логотипа: шесть отдельных букв, чтобы каждая тонула и покачивалась сама.
// Координаты шрифта: x от 1 до 4098, базовая линия y = 0, буквы вверх до y = -588.
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { WORD_PATH } from "@/lib/brand";

// Границы букв по x (v e r v e r)
const LETTERS: [number, number][] = [
  [1, 768],
  [799, 1472],
  [1532, 2042],
  [2057, 2824],
  [2855, 3528],
  [3588, 4098],
];

export type Letter = { geometry: THREE.ShapeGeometry; center: number; width: number };

// Геометрия каждой буквы в единицах шрифта: начало координат в середине буквы на базовой линии, y вверх
export function buildLetters(): Letter[] {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${WORD_PATH}"/></svg>`;
  const data = new SVGLoader().parse(svg);
  const shapes = data.paths.flatMap((p) => p.toShapes());
  const groups: THREE.Shape[][] = LETTERS.map(() => []);
  for (const shape of shapes) {
    const box = new THREE.Box2().setFromPoints(shape.getPoints());
    const cx = (box.min.x + box.max.x) / 2;
    const i = LETTERS.findIndex(([a, b]) => cx >= a - 20 && cx <= b + 20);
    groups[Math.max(0, i)].push(shape);
  }
  return groups.map((list, i) => {
    const [a, b] = LETTERS[i];
    const center = (a + b) / 2;
    const geometry = new THREE.ShapeGeometry(list, 10);
    // SVG смотрит y вниз: переворачиваем и ставим середину буквы в 0
    geometry.scale(1, -1, 1);
    geometry.translate(-center, 0, 0);
    return { geometry, center, width: b - a };
  });
}
