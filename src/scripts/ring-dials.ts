// Живая настройка кольца через DialKit (https://github.com/joshpuckett/dialkit).
// Открывается только по ссылке с ?dial, например /site-portfolio/?dial.
// Найденные значения: «Copy» в меню версий панели, потом перенести в tune (ring.ts) и Ring.astro.
import { createDialKit, createDialRoot } from "dialkit/vanilla";
import dialCss from "dialkit/vanilla/styles.css?url";
import { tune } from "./ring";

const ring = document.querySelector<HTMLElement>("[data-ring]");
const step = ring ? 360 / Number(ring.dataset.n || 12) : 30; // градусов на одну панель
const secPerPanel = Math.round((step / (tune.autoSpeed * 1000)) * 2) / 2;

// стили панели подключаем только здесь, чтобы обычная страница их не грузила
const link = Object.assign(document.createElement("link"), { rel: "stylesheet", href: dialCss });
document.head.append(link);
createDialRoot({ position: "bottom-right" });

const kit = createDialKit(
  "Кольцо",
  {
    "Секунд на панель": [secPerPanel, 2, 40, 0.5], // сам ход кольца
    "Пауза после действия, мс": [tune.autoDelay, 0, 8000, 100],
    "Разгон хода, мс": [tune.autoEase, 50, 2000, 10],
    "Поворот кнопкой, мс": [tune.turnMs, 150, 1500, 10],
    "Вид": {
      "Размер панелей": [1, 0.6, 1.4, 0.01],
      "Глубина перспективы": [1, 0.4, 3, 0.05],
      "Зазор между панелями": [1, 0, 4, 0.1],
    },
  },
  { id: "ring", persist: true }
);

kit.subscribe((v) => {
  tune.autoSpeed = step / (v["Секунд на панель"] * 1000);
  tune.autoDelay = v["Пауза после действия, мс"];
  tune.autoEase = v["Разгон хода, мс"];
  tune.turnMs = v["Поворот кнопкой, мс"];
  if (ring) {
    ring.style.setProperty("--ring-size", String(v["Вид"]["Размер панелей"]));
    ring.style.setProperty("--ring-depth", String(v["Вид"]["Глубина перспективы"]));
    ring.style.setProperty("--ring-gap", String(v["Вид"]["Зазор между панелями"]));
  }
  dispatchEvent(new Event("ring:tune"));
});
