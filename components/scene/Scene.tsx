"use client";
// Холст WebGL на весь экран за страницей. Отдельный кусок кода: грузится только на главной
// и только там, где WebGL работает и в системе не выключены анимации.
import { advance, Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
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
  const [covered, setCovered] = useState(false); // блок ниже закрыл сцену целиком
  const [hidden, setHidden] = useState(false);
  // вертикальный экран (телефон): кольцо там вёрсткой (Stage), сцена рисует только первый экран
  const [portrait, setPortrait] = useState(() => innerWidth / innerHeight < 0.8);

  useEffect(() => {
    const check = () => setPortrait(innerWidth / innerHeight < 0.8);
    addEventListener("resize", check);
    return () => removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!home) return;
    // на телефоне сцену закрывает уже блок с кольцом: дальше она не рисует
    const check = () => {
      const after = document.querySelector(portrait ? "[data-scene-stage]" : "[data-scene-after]");
      setCovered(!!after && after.getBoundingClientRect().top <= 0);
    };
    check();
    addEventListener("scroll", check, { passive: true });
    addEventListener("resize", check);
    return () => {
      removeEventListener("scroll", check);
      removeEventListener("resize", check);
    };
  }, [home, portrait]);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const running = busy || (home && !covered && !hidden);

  // Покадровая запись видео (?scene=record): сцена сама не рисует, кадр делает скрипт записи
  // через window.__sceneAdvance(секунды) и сразу снимает экран. Так видео ровное даже без видеокарты.
  const [record] = useState(() => {
    try {
      return sessionStorage.getItem("scene") === "record";
    } catch {
      return false;
    }
  });
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
      dpr={[1, portrait ? 1.5 : 1.75]}
      frameloop={running && !record ? "always" : "never"}
      gl={{ antialias: true, alpha: false, stencil: false, powerPreference: "high-performance" }}
      camera={{ fov: 30, near: 0.1, far: 600, position: [0, 0.3, 10] }}
      events={undefined}
      style={{ position: "absolute", inset: 0 }}
    >
      <World
        key={portrait ? "portrait" : "landscape"}
        cases={cases}
        home={home}
        navigate={navigate}
        host={host}
        onReady={onReady}
        setBusy={setBusy}
        noRing={portrait}
      />
    </Canvas>
  );
}
