"use client";
// Движение по всему сайту:
// — проявление блоков с data-reveal, когда они доходят до экрана;
// — плавная прокрутка колесом (только компьютер с мышью, Lenis);
// — ромб-шторка между страницами: новая страница раскрывается ромбом из точки клика (View Transitions);
// — курсор-ромб, над работами он превращается в «Открыть».
// При выключенных в системе анимациях нет плавной прокрутки и шторки, блоки просто проявляются на месте.
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { usePathname, useRouter } from "next/navigation";
import { dict } from "@/lib/dict";
import { isHome, langOf } from "@/lib/i18n";
import { useEffect, useRef } from "react";
import { BASE_PATH } from "@/lib/paths";
import { on, sceneState } from "@/lib/scene-bus";
import s from "./Motion.module.css";

const trim = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Motion() {
  const pathname = usePathname();
  const router = useRouter();
  const pending = useRef<null | { path: string; done: () => void }>(null);
  const lenis = useRef<Lenis | null>(null);
  const cursor = useRef<HTMLDivElement>(null);

  // ---------- проявление при прокрутке ----------
  useEffect(() => {
    (window as Window & { __motion?: boolean }).__motion = true;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    const scan = () => document.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));
    scan();
    // блоки, которые появились позже (переключатель «Компьютер / Телефон», ответ формы)
    const main = document.getElementById("main");
    const mo = new MutationObserver(scan);
    if (main) mo.observe(main, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  // ---------- плавная прокрутка ----------
  useEffect(() => {
    if (!matchMedia("(pointer: fine) and (hover: hover)").matches || reduced()) return;
    // allowNestedScroll: колесо над полем «Что ещё важно» и другими прокручиваемыми блоками крутит их, а не страницу
    const l = new Lenis({ autoRaf: true, lerp: 0.1, anchors: true, stopInertiaOnNavigate: true, allowNestedScroll: true });
    lenis.current = l;
    return () => {
      l.destroy();
      lenis.current = null;
    };
  }, []);

  // ---------- доводка между надписью и кольцом ----------
  // Между первым экраном и кольцом страница не останавливается на полпути: если человек
  // перестал листать вниз, она доезжает до кольца целиком, вместе с подписью и кнопками;
  // если листал вверх — до надписи.
  useEffect(() => {
    if (!isHome(pathname)) return;
    let last = scrollY;
    let dir = 0;
    let timer = 0;
    let touching = false;
    let snapping = false;
    const settle = () => {
      timer = 0;
      const root = document.documentElement;
      const stage = document.querySelector<HTMLElement>("[data-scene-stage]");
      if (touching || snapping || !stage || !root.classList.contains("scene-on")) return;
      if (lenis.current?.isScrolling) return void (timer = window.setTimeout(settle, 120));
      const top = Math.round(stage.getBoundingClientRect().top + scrollY);
      const y = scrollY;
      if (y <= 2 || y >= top - 2) return;
      // На телефоне к надписи только если сдвинули вверх больше трети экрана, а при меньшем сдвиге
      // страница остаётся, где её оставили (verver: чуть сдвинул с дуги, и она уже уезжала наверх)
      if (!lenis.current && dir < 0 && top - y <= innerHeight * 0.35) return;
      const to = dir < 0 ? 0 : top;
      snapping = true;
      const done = () => {
        snapping = false;
        last = scrollY;
      };
      if (lenis.current) {
        lenis.current.scrollTo(to, { duration: 0.9, onComplete: done });
      } else {
        scrollTo({ top: to, behavior: reduced() ? "auto" : "smooth" });
        const off = () => {
          removeEventListener("scrollend", off);
          clearTimeout(guard);
          done();
        };
        const guard = window.setTimeout(off, 1500);
        addEventListener("scrollend", off);
      }
    };
    const onScroll = () => {
      const y = scrollY;
      if (y !== last) dir = y > last ? 1 : -1;
      last = y;
      if (snapping) return;
      clearTimeout(timer);
      timer = window.setTimeout(settle, 160);
    };
    const onTouchStart = () => {
      touching = true;
      clearTimeout(timer);
    };
    const onTouchEnd = () => {
      touching = false;
      clearTimeout(timer);
      timer = window.setTimeout(settle, 160);
    };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("touchstart", onTouchStart, { passive: true });
    addEventListener("touchend", onTouchEnd, { passive: true });
    addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      clearTimeout(timer);
      removeEventListener("scroll", onScroll);
      removeEventListener("touchstart", onTouchStart);
      removeEventListener("touchend", onTouchEnd);
      removeEventListener("touchcancel", onTouchEnd);
    };
  }, [pathname]);

  // ---------- ромб-шторка ----------
  // Ссылку внутри сайта перехватываем раньше next/link: снимок старой страницы, переход,
  // снимок новой, и новая раскрывается ромбом поверх старой (стили в globals.css).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      if (a.closest("[data-no-curtain]")) return;
      // «Открыть работу» под кольцом: панель сама раскрывается в страницу кейса
      if (sceneState.live && a.hasAttribute("data-scene-open")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (BASE_PATH && url.pathname !== BASE_PATH && !url.pathname.startsWith(`${BASE_PATH}/`)) return;
      // та же страница (в том числе с другим ?параметром или #якорем): переход без шторки, как обычно
      if (trim(url.pathname) === trim(location.pathname)) return;
      if (!("startViewTransition" in document) || reduced()) return;

      e.preventDefault();
      e.stopPropagation();
      const to = url.pathname.slice(BASE_PATH.length) || "/";

      // центр ромба: точка клика, с клавиатуры — середина ссылки
      let x = e.clientX;
      let y = e.clientY;
      if (!e.detail) {
        const r = a.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top + r.height / 2;
      }
      const reach = Math.max(x, innerWidth - x) + Math.max(y, innerHeight - y);
      const root = document.documentElement;
      root.style.setProperty("--vt-x", `${Math.round(x)}px`);
      root.style.setProperty("--vt-y", `${Math.round(y)}px`);
      root.style.setProperty("--vt-r", `${Math.ceil(reach)}px`);
      root.classList.add("is-curtain");

      lenis.current?.stop();
      const vt = document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            const done = () => {
              clearTimeout(timer);
              pending.current = null;
              resolve();
            };
            // страница не пришла за 3 секунды: показываем то, что есть
            const timer = setTimeout(done, 3000);
            pending.current = { path: trim(to), done };
            router.push(to + url.search + url.hash);
          })
      );
      vt.finished.finally(() => {
        root.classList.remove("is-curtain");
        lenis.current?.start();
      });
    };
    addEventListener("click", onClick, true);
    return () => removeEventListener("click", onClick, true);
  }, [router]);

  // новая страница на месте и прокручена наверх: можно снимать её снимок.
  // Не через requestAnimationFrame: пока шторка ждёт новую страницу, браузер не рисует кадры
  // и rAF не срабатывает, тогда каждый переход висел до запасного таймера в 3 секунды.
  useEffect(() => {
    const p = pending.current;
    if (p && trim(pathname) === p.path) setTimeout(p.done, 0);
    // прокрутку Next.js сделал сам, Lenis должен об этом знать
    lenis.current?.scrollTo(scrollY, { immediate: true, force: true });
  }, [pathname]);

  // ---------- курсор ----------
  useEffect(() => {
    const el = cursor.current;
    if (!el || !matchMedia("(pointer: fine) and (hover: hover)").matches) return;
    const root = document.documentElement;
    root.classList.add("cursor-on");
    let x = -100;
    let y = -100;
    let sceneOpen = false;
    let frame = 0;

    const modeAt = (target: Element | null) => {
      if (!target) return "";
      if (target.closest("input:not([type=checkbox]):not([type=radio]):not([type=submit]), textarea, select, [contenteditable]")) return "text";
      if (sceneOpen || target.closest("[data-cursor='open']")) return "open";
      if (target.closest("a[href], button:not(:disabled), label, summary, [role='button']")) return "link";
      return "";
    };
    const paint = () => {
      frame = 0;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      const mode = modeAt(document.elementFromPoint(x, y));
      if (el.dataset.mode !== mode) el.dataset.mode = mode;
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onMove = (e: PointerEvent) => {
      // мышь и перо над планшетом рисуют ромб; у пальца курсора нет
      if (e.pointerType === "touch") return;
      x = e.clientX;
      y = e.clientY;
      el.dataset.on = "";
      queue();
    };
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) delete el.dataset.on;
    };
    const onDown = () => (el.dataset.down = "");
    const onUp = () => delete el.dataset.down;
    const offScene = on("cursor", ({ mode }) => {
      sceneOpen = mode === "open";
      queue();
    });
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("scroll", queue, { passive: true });
    document.addEventListener("mouseout", onLeave);
    addEventListener("pointerdown", onDown);
    addEventListener("pointerup", onUp);
    return () => {
      root.classList.remove("cursor-on");
      cancelAnimationFrame(frame);
      offScene();
      removeEventListener("pointermove", onMove);
      removeEventListener("scroll", queue);
      document.removeEventListener("mouseout", onLeave);
      removeEventListener("pointerdown", onDown);
      removeEventListener("pointerup", onUp);
    };
  }, []);

  // после смены страницы под курсором другое
  useEffect(() => {
    cursor.current?.removeAttribute("data-mode");
  }, [pathname]);

  return (
    <div ref={cursor} className={s.cursor} aria-hidden="true" data-overlap-ok>
      <span className={s.fill} />
      <span className={s.ring} />
      <span className={`${s.open} caps`}>{dict[langOf(pathname)].cursorOpen}</span>
    </div>
  );
}
