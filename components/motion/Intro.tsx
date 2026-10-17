import { MARK_BOTTOM, MARK_TOP } from "@/lib/brand";
import s from "./Intro.module.css";

// Заставка при первом открытии главной: две «v» сходятся в ромб, ромб раскрывается в страницу.
// Около секунды, один раз за визит, не мешает нажимать и листать (pointer-events: none),
// любое действие её убирает. Включает её скрипт в <head> (app/layout.tsx); без анимаций в системе
// и без JavaScript её нет. Двигаются только transform и opacity.
export function Intro() {
  return (
    <div className={s.intro} aria-hidden="true">
      {/* четыре полуплоскости вокруг ромба: разъезжаются, и в ромбе открывается страница */}
      {[45, 135, 225, 315].map((a) => (
        <div key={a} className={s.side} style={{ "--a": `${a}deg` } as React.CSSProperties}>
          <div className={s.piece} />
        </div>
      ))}
      <div className={s.plug} />
      <svg className={s.mark} viewBox="-50 -50 100 100">
        <polygon className={s.top} points={MARK_TOP} />
        <polygon className={s.bottom} points={MARK_BOTTOM} />
      </svg>
    </div>
  );
}

// Скрипт для <head>: решает до первой отрисовки, показывать ли заставку
// base — адрес превью (BASE_PATH); главная — «base/» и английская «base/en/»
export const introScript = (base: string) => `(function(){try{var d=document.documentElement;
var p=location.pathname.slice(${JSON.stringify(base)}.length).replace(/\\/$/,"");if(p!==""&&p!=="/en")return;
if(matchMedia("(prefers-reduced-motion: reduce)").matches||sessionStorage.getItem("intro"))return;
sessionStorage.setItem("intro","1");d.classList.add("is-intro");
var done=function(){d.classList.remove("is-intro");off()};
var skip=function(){d.classList.add("is-intro-skip");setTimeout(done,220)};
var ev=["pointerdown","keydown","wheel","touchstart"];
var off=function(){ev.forEach(function(e){removeEventListener(e,skip,true)})};
ev.forEach(function(e){addEventListener(e,skip,{capture:true,passive:true})});
setTimeout(done,1300);}catch(e){}})();`;
