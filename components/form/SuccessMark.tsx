import { MARK_BOTTOM, MARK_TOP } from "@/lib/brand";
import s from "./RequestForm.module.css";

// Знак verver собирается из двух половин, когда заявка ушла
export function SuccessMark() {
  return (
    <svg className={s.mark} viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">
      <polygon className={s.markTop} points={MARK_TOP} fill="currentColor" style={{ fillOpacity: "var(--mark-top)" }} />
      <polygon className={s.markBottom} points={MARK_BOTTOM} fill="currentColor" />
    </svg>
  );
}
