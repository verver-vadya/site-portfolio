"use client";

// Общая часть форм (заявка, вступление в объединение): проверка полей, ошибки рядом с полями,
// честная отправка в Formspree. «Спасибо» показываем только после ответа сервера; при ошибке
// данные остаются в полях. Без JS форма уходит обычным POST, а браузер сам проверяет обязательные поля.

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { Lang } from "@/lib/i18n";
import { TEXTS, TIMEOUT_MS, validateField, type Field } from "./validate";
import s from "./RequestForm.module.css";

type Status = { state: "" | "error" | "success"; message: string };

// keys — id полей в порядке проверки; у групп переключателей — id первого варианта
export function useForm(lang: Lang, keys: string[]) {
  const TEXT = TEXTS[lang];
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const sending = useRef(false);
  // Пока кнопку отправки нажимают, ошибку при уходе из поля не показываем: она сдвинула бы кнопку
  // из-под курсора, и нажатие потерялось бы. Поля всё равно проверит отправка.
  const pressingSubmit = useRef(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const errorsRef = useRef(errors);
  errorsRef.current = errors;
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>({ state: "", message: "" });
  const [successCount, setSuccessCount] = useState(0);

  useEffect(() => {
    formRef.current!.noValidate = true; // проверяем сами, с понятными сообщениями
  }, []);

  const el = (key: string) => formRef.current!.querySelector<Field>(`#${key}`)!;
  const check = (key: string) => validateField(el(key), formRef.current!, TEXT);
  const setError = (key: string, message: string) => setErrors((prev) => ({ ...prev, [key]: message }));

  // Ошибку показываем, когда человек ушёл из поля, а убираем сразу, как только он её исправил
  const leave = (key: string) => () => {
    if (pressingSubmit.current) return;
    if (!errorsRef.current[key] && el(key).value.trim() === "") return;
    setError(key, check(key));
  };
  const recheck = (key: string) => () => {
    if (errorsRef.current[key]) setError(key, check(key));
  };

  // aria-invalid и описание поля: сначала ошибка, потом подсказка
  const aria = (key: string, hint?: string) => {
    const describedBy = [errors[key] && `${key}-error`, hint].filter(Boolean).join(" ");
    return { "aria-invalid": errors[key] ? true : undefined, "aria-describedby": describedBy || undefined };
  };
  const error = (key: string, wide?: boolean) =>
    errors[key] ? (
      <p className={`field__error ${wide ? s.errorWide : ""}`} id={`${key}-error`}>
        {errors[key]}
      </p>
    ) : null;

  const showStatus = (next: Status) => {
    flushSync(() => setStatus(next));
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    statusRef.current?.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending.current) return; // защита от двойного клика
    const form = e.currentTarget;

    const next: Record<string, string> = {};
    let first = "";
    for (const key of keys) {
      const message = check(key);
      if (message) {
        next[key] = message;
        first ||= key;
      }
    }
    flushSync(() => {
      setErrors(next);
      if (first) setStatus({ state: "error", message: TEXT.invalidSummary });
    });
    if (first) {
      el(first).focus();
      return;
    }

    if (/YOUR_FORM_ID/.test(form.action)) return showStatus({ state: "error", message: TEXT.notConfigured });
    if (!navigator.onLine) return showStatus({ state: "error", message: TEXT.offline });

    sending.current = true;
    flushSync(() => {
      setBusy(true);
      setStatus({ state: "", message: "" });
    });
    let result: Status;
    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      form.reset();
      setErrors({});
      setSuccessCount((n) => n + 1);
      result = { state: "success", message: TEXT.success };
    } catch (err) {
      const message =
        (err as Error).name === "TimeoutError"
          ? TEXT.timeout
          : !navigator.onLine
            ? TEXT.offline
            : err instanceof TypeError
              ? TEXT.network
              : TEXT.server;
      result = { state: "error", message };
    }
    sending.current = false;
    setBusy(false);
    showStatus(result);
  }

  // кнопка отправки: см. pressingSubmit выше
  const onSubmitPress = () => {
    pressingSubmit.current = true;
    document.addEventListener("pointerup", () => setTimeout(() => (pressingSubmit.current = false)), { once: true });
  };

  return { TEXT, formRef, statusRef, busy, status, successCount, leave, recheck, aria, error, submit, onSubmitPress };
}
