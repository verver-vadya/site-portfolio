"use client";
// Холст WebGL на весь экран за страницей. Отдельный кусок кода: грузится только на главной
// и только там, где WebGL работает и в системе не выключены анимации.
import { advance, Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import type { SceneCase } from "@/lib/scene-bus";
import { World } from "./World";

export type SceneProps = {
  cases: SceneCase[];
  home: boolean; // открыта главная
  navigate: (href: string) => void;
  host: HTMLElement;
  onReady: () => void;
};

export default function Scene({ cases, home, navigate, host, onReady }: SceneProps) {
  const [busy, setBusy] = useState(false); // панель раскрывается в страницу кейса
  const [covered, setCovered] = useState(false); // список работ ниже закрыл сцену целиком
  const [hidden, setHidden] = useState(false);
  // вертикальный экран (телефон): кольцо из скриншотов с телефона
  const [portrait, setPortrait] = useState(() => innerWidth / innerHeight < 0.8);

  useEffect(() => {
    const check = () => setPortrait(innerWidth / innerHeight < 0.8);
    addEventListener("resize", check);
    return () => removeEventListener("resize", check);
  }, []);

  const ringCases = useMemo(
    () => (portrait ? cases.map((c) => ({ ...c, shots: c.phone.length ? c.phone : c.shots })) : cases),
    [cases, portrait]
  );

  useEffect(() => {
    if (!home) return;
    const check = () => {
      const after = document.querySelector("[data-scene-after]");
      setCovered(!!after && after.getBoundingClientRect().top <= 0);
    };
    check();
    addEventListener("scroll", check, { passive: true });
    addEventListener("resize", check);
    return () => {
      removeEventListener("scroll", check);
      removeEventListener("resize", check);
    };
  }, [home]);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const running = busy || (home && !covered && !hidden);

  // Покадровая запись видео (?scene=record): сцена сама не рисует, кадр делает скрипт записи
  // через window.__sceneAdvance(секунды) и сразу снимает экран. Так видео ровное даже без видеокарты.
  const [record] = useState(() => sessionStorage.getItem("scene") === "record");
  useEffect(() => {
    if (!record) return;
    const w = window as Window & { __sceneAdvance?: (t: number) => void };
    w.__sceneAdvance = (t) => advance(t);
    return () => {
      delete w.__sceneAdvance;
    };
  }, [record]);

  return (
    <Canvas
      flat
      dpr={[1, 1.75]}
      frameloop={running && !record ? "always" : "never"}
      gl={{ antialias: true, alpha: false, stencil: false, powerPreference: "high-performance" }}
      camera={{ fov: 30, near: 0.1, far: 600, position: [0, 0.3, 10] }}
      events={undefined}
      style={{ position: "absolute", inset: 0 }}
    >
      <World
        key={portrait ? "portrait" : "landscape"}
        cases={ringCases}
        navigate={navigate}
        host={host}
        onReady={onReady}
        setBusy={setBusy}
      />
    </Canvas>
  );
}
