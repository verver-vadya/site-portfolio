"use client";
// Панель DialKit для подбора движения кольца прямо на своём устройстве. Видна только с ?dial
// в адресе (дальше по сайту до закрытия вкладки), посетители её не видят. Значения
// запоминаются в браузере; кнопка «Скопировать значения» кладёт их в буфер, чтобы прислать.
import { useEffect } from "react";
import { tune, TUNE_DEFAULTS, type Tune } from "@/lib/tune";

export function DialTune() {
  useEffect(() => {
    let on = false;
    try {
      if (/[?&]dial\b/.test(location.search)) sessionStorage.setItem("dial", "1");
      on = sessionStorage.getItem("dial") === "1";
    } catch {
      on = /[?&]dial\b/.test(location.search);
    }
    if (!on) return;
    let stop = () => {};
    let alive = true;
    Promise.all([import("dialkit/vanilla"), import("dialkit/vanilla/styles.css")]).then(([dk]) => {
      if (!alive) return;
      const d = TUNE_DEFAULTS;
      const root = dk.createDialRoot();
      const kit = dk.createDialKit(
        "Кольцо",
        {
          "Подъём, с": [d.enterTime, 0.8, 5, 0.1],
          "Уход под воду, с": [d.leaveTime, 0.2, 2, 0.05],
          "Выдвижение при наведении": [d.hover, 0, 0.4, 0.01],
          "Автошаг, с": [d.autoStep, 2, 12, 0.5],
          "Скорость пальца": [d.dragSpeed, 0.4, 2, 0.05],
          "Затухание броска": [d.inertia, 1, 8, 0.1],
          "Жёсткость доводки": [d.spring, 8, 60, 1],
          "Скопировать значения": { type: "action" },
        },
        {
          persist: true,
          onAction: () => {
            const text = JSON.stringify(tune, null, 2);
            navigator.clipboard?.writeText(text).catch(() => prompt("Значения кольца", text));
          },
        }
      );
      kit.subscribe((vals) => {
        const v = vals as unknown as Record<string, number>;
        const next: Tune = {
          enterTime: v["Подъём, с"],
          leaveTime: v["Уход под воду, с"],
          hover: v["Выдвижение при наведении"],
          autoStep: v["Автошаг, с"],
          dragSpeed: v["Скорость пальца"],
          inertia: v["Затухание броска"],
          spring: v["Жёсткость доводки"],
        };
        for (const k of Object.keys(next) as (keyof Tune)[]) if (Number.isFinite(next[k])) tune[k] = next[k];
      });
      stop = () => {
        kit.destroy();
        root.destroy();
      };
    });
    return () => {
      alive = false;
      stop();
    };
  }, []);
  return null;
}
