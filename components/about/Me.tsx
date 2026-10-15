import fs from "node:fs";
import path from "node:path";
import { Logo } from "@/components/Logo";
import { withBase } from "@/lib/paths";
import { owner } from "@/lib/site";
import s from "./Me.module.css";

// Фото владельца в круге. Берёт public/me.jpg (или .png/.webp, квадратное, от 400 px),
// пока файла нет — серый круг со знаком verver. Проверка идёт при сборке, в браузер не попадает.
const PHOTO = ["me.webp", "me.jpg", "me.jpeg", "me.png"].find((f) => fs.existsSync(path.join(process.cwd(), "public", f)));

// size — диаметр в px; без него диаметр задаёт родитель через --size (по умолчанию 72 px)
export function Me({ size, className }: { size?: number; className?: string }) {
  const style = size ? ({ "--size": `${size}px` } as React.CSSProperties) : undefined;
  if (PHOTO) {
    return (
      <img
        className={`${s.me} ${className ?? ""}`}
        src={withBase(PHOTO)}
        alt={`Фото: ${owner.name}`}
        width={480}
        height={480}
        decoding="async"
        style={style}
      />
    );
  }
  return (
    <span className={`${s.me} ${s.empty} ${className ?? ""}`} style={style} aria-hidden="true">
      <Logo variant="mark" className={s.mark} />
    </span>
  );
}
