// Связь страницы и 3D-сцены: события на window с приставкой verver:.
// Сцена грузится отдельно и может не загрузиться вовсе, поэтому страница с ней не связана напрямую.
export type SceneEvents = {
  "ring-active": { index: number }; // сцена → подпись: какая работа сейчас спереди
  "ring-step": { dir: 1 | -1 }; // кнопки ← → → сцена
  "ring-go": { index: number }; // точки под кольцом → сцена: повернуть к этой работе
  "ring-auto": { wait: number | null }; // сцена → точки: через сколько секунд сам шагнёт (null — не шагает)
  "ring-open": { slug: string }; // «Открыть» → сцена раскрывает панель в страницу кейса
  "scene-ready": { ready: boolean }; // сцена отрисовала первый кадр (или отключилась)
  cursor: { mode: "open" | null }; // сцена → курсор: над панелью кольца
};

export function emit<K extends keyof SceneEvents>(name: K, detail: SceneEvents[K]) {
  window.dispatchEvent(new CustomEvent(`verver:${name}`, { detail }));
}

export function on<K extends keyof SceneEvents>(name: K, fn: (detail: SceneEvents[K]) => void) {
  const handler = (e: Event) => fn((e as CustomEvent<SceneEvents[K]>).detail);
  window.addEventListener(`verver:${name}`, handler);
  return () => window.removeEventListener(`verver:${name}`, handler);
}

// Что сцена знает о работах: адреса скриншотов для панелей кольца
export type SceneShot = { src: string; large: string; width: number; height: number };
// shots — экраны с компьютера, phone — с телефона (на вертикальном экране кольцо из них)
export type SceneCase = { slug: string; title: string; shots: SceneShot[]; phone: SceneShot[] };

// live: сцена жива и сама обрабатывает «Открыть» (иначе ссылка работает как обычно);
// active: какая работа сейчас спереди (подпись берёт её, когда снова появляется на главной);
// risen: кольцо уже поднялось из воды. Подъём играет один раз, пока страницу не обновят,
// дальше кольцо ездит вместе со страницей, как обычный блок
export const sceneState = { live: false, active: 0, risen: false };
