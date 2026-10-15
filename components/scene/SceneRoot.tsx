"use client";
// Общая 3D-сцена (вода, отражение, кольцо работ). Живёт в layout и не пересоздаётся при переходах,
// поэтому панель кольца может раскрыться прямо в страницу кейса.
// Здесь только решение, грузить ли сцену: тяжёлый код (three.js) приходит отдельным файлом и только
// на главной. Без WebGL, на слабой видеокарте и при выключенных в системе анимациях сцены нет:
// остаются надпись с отражением на CSS и обычный список работ.
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import type { SceneCase } from "@/lib/scene-bus";
import { emit } from "@/lib/scene-bus";
import type { SceneProps } from "./Scene";
import s from "./SceneRoot.module.css";

function capable() {
  try {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    // ?scene=force — для проверки в браузере без видеокарты;
    // ?scene=record — то же и покадровая запись видео (см. Scene.tsx)
    const mode = location.search.match(/[?&]scene=(force|record)/)?.[1];
    if (mode) sessionStorage.setItem("scene", mode);
    const force = !!sessionStorage.getItem("scene");
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: !force });
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function SceneRoot({ cases }: { cases: SceneCase[] }) {
  const path = usePathname();
  const router = useRouter();
  const home = path === "/";
  const host = useRef<HTMLDivElement>(null);
  const [ok, setOk] = useState<boolean | null>(null);
  const [Scene, setScene] = useState<ComponentType<SceneProps> | null>(null);

  useEffect(() => {
    const yes = capable();
    setOk(yes);
    document.documentElement.classList.toggle("scene-on", yes);
  }, []);

  // сцену грузим, когда страница уже показана
  useEffect(() => {
    if (!ok || !home || Scene) return;
    let cancelled = false;
    const load = () =>
      import("./Scene")
        .then((m) => !cancelled && setScene(() => m.default))
        .catch(() => {
          document.documentElement.classList.remove("scene-on");
          setOk(false);
        });
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
      .requestIdleCallback;
    if (document.readyState === "complete") idle ? idle(load, { timeout: 800 }) : setTimeout(load, 200);
    else addEventListener("load", () => (idle ? idle(load, { timeout: 800 }) : setTimeout(load, 200)), { once: true });
    return () => {
      cancelled = true;
    };
  }, [ok, home, Scene]);

  const navigate = useCallback((href: string) => router.push(href), [router]);
  const onReady = useCallback(() => {
    document.documentElement.classList.add("scene-ready");
    emit("scene-ready", { ready: true });
  }, []);

  return (
    <div ref={host} className={s.root} data-home={home ? "" : undefined} data-overlap-ok aria-hidden="true">
      {Scene && host.current && <Scene cases={cases} home={home} navigate={navigate} host={host.current} onReady={onReady} />}
    </div>
  );
}
