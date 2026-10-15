"use client";

// Форма заявки (data-form): проверка ввода на русском и честная отправка в Formspree.
// «Спасибо» показываем только после ответа сервера; при ошибке данные остаются в полях.
// Без JS форма уходит обычным POST, а браузер сам проверяет обязательные поля.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { owner } from "@/lib/site";
import { SuccessMark } from "./SuccessMark";
import { TEXT, TIMEOUT_MS, validateField, type Field } from "./validate";
import s from "./RequestForm.module.css";

const types = ["Лендинг", "Визитка или портфолио", "Сайт с записью или каталогом", "Пока не знаю"];
const terms = ["Нужно за 2–3 недели", "В течение месяца-двух", "Не горит", "Пока не знаю"];
const budgets = ["До 20 000 ₽", "20–40 тысяч ₽", "40–70 тысяч ₽", "Больше 70 тысяч ₽", "Пока не знаю"];

// Порядок проверки = порядок полей; у групп переключателей ключ — id первого варианта
const KEYS = ["f-name", "f-contact", "f-business", "f-type", "f-when", "f-budget", "f-message", "f-consent"];

type Status = { state: "" | "error" | "success"; message: string };

export function RequestForm() {
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
    const form = formRef.current!;
    form.noValidate = true; // проверяем сами, с понятными сообщениями
    // «Обсудить» в ценах открывает заявку с ?type=…: сразу отмечаем этот тип сайта
    const picked = new URLSearchParams(location.search).get("type");
    if (picked) {
      const radio = form.querySelector<HTMLInputElement>(`input[type="radio"][value="${CSS.escape(picked)}"]`);
      if (radio) radio.checked = true;
    }
  }, []);

  const el = (key: string) => formRef.current!.querySelector<Field>(`#${key}`)!;
  const check = (key: string) => validateField(el(key), formRef.current!);
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
    for (const key of KEYS) {
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

  const choices = (key: string, name: string, list: string[], required = false) =>
    list.map((t, i) => (
      <label key={t} className={s.choice}>
        <input
          id={i === 0 ? key : undefined}
          type="radio"
          name={name}
          value={t}
          required={required || undefined}
          data-error-required={required ? "Выберите, какой сайт нужен, или «Пока не знаю»" : undefined}
          onChange={recheck(key)}
          {...aria(key)}
        />
        <span>{t}</span>
      </label>
    ));

  return (
    <form
      ref={formRef}
      className={s.form}
      action={`https://formspree.io/f/${owner.formspree}`}
      method="post"
      data-form
      onSubmit={submit}
    >
      <input type="hidden" name="_subject" value="Заявка с сайта-портфолио" />

      <div className={s.field}>
        <label className="caps" htmlFor="f-name">
          Как к&nbsp;вам обращаться
        </label>
        <input
          id="f-name"
          name="Имя"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          data-error-required="Напишите, как к вам обращаться"
          onBlur={leave("f-name")}
          onInput={recheck("f-name")}
          {...aria("f-name")}
        />
        {error("f-name")}
      </div>

      <div className={s.field}>
        <label className="caps" htmlFor="f-contact">
          Куда ответить
        </label>
        <input
          id="f-contact"
          name="Контакт"
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          required
          data-validate="contact"
          data-error-required="Напишите ник в Telegram, телефон или почту"
          onBlur={leave("f-contact")}
          onInput={recheck("f-contact")}
          {...aria("f-contact", "f-contact-hint")}
        />
        <p className={`${s.hint} muted`} id="f-contact-hint">
          Ник в&nbsp;Telegram, телефон или почта
        </p>
        {error("f-contact")}
      </div>

      <div className={`${s.field} ${s.wide}`}>
        <label className="caps" htmlFor="f-business">
          Чем занимается бизнес
        </label>
        <input
          id="f-business"
          name="Бизнес"
          type="text"
          required
          minLength={3}
          data-error-required="Пара слов о том, чем вы занимаетесь"
          onBlur={leave("f-business")}
          onInput={recheck("f-business")}
          {...aria("f-business", "f-business-hint")}
        />
        <p className={`${s.hint} muted`} id="f-business-hint">
          Например: салон стрижки в&nbsp;Казани, ремонт квартир
        </p>
        {error("f-business")}
      </div>

      <fieldset className={`${s.field} ${s.wide}`}>
        <legend className="caps">Какой сайт нужен</legend>
        <div className={s.choices}>{choices("f-type", "Какой сайт", types, true)}</div>
        {error("f-type")}
      </fieldset>

      <fieldset className={`${s.field} ${s.wide}`}>
        <legend className="caps">Сроки</legend>
        <div className={s.choices}>{choices("f-when", "Сроки", terms)}</div>
      </fieldset>

      <fieldset className={`${s.field} ${s.wide}`}>
        <legend className="caps">Бюджет</legend>
        <div className={s.choices}>{choices("f-budget", "Бюджет", budgets)}</div>
      </fieldset>

      <div className={`${s.field} ${s.wide}`}>
        <label className="caps" htmlFor="f-message">
          Что ещё важно <span className="muted">(необязательно)</span>
        </label>
        <textarea
          id="f-message"
          name="Комментарий"
          rows={4}
          maxLength={2000}
          onBlur={leave("f-message")}
          onInput={recheck("f-message")}
          {...aria("f-message", "f-message-hint")}
        />
        <p className={`${s.hint} muted`} id="f-message-hint">
          Ссылка на&nbsp;сайт сейчас, примеры, которые нравятся, дата запуска
        </p>
        {error("f-message")}
      </div>

      <div className={`${s.field} ${s.wide} ${s.check}`}>
        <input
          id="f-consent"
          name="Согласие"
          type="checkbox"
          value="да"
          required
          data-error-required="Без согласия на обработку данных я не могу принять заявку"
          onChange={recheck("f-consent")}
          {...aria("f-consent")}
        />
        <label htmlFor="f-consent">
          Даю согласие на&nbsp;обработку персональных данных по&nbsp;
          <Link className={`link ${s.line}`} href="/privacy/">
            политике конфиденциальности
          </Link>
        </label>
        {error("f-consent", true)}
      </div>

      {/* Ловушка для спам-ботов: человек это поле не видит */}
      <input className={s.trap} type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <div className={`${s.send} ${s.wide}`}>
        <button
          className="btn"
          type="submit"
          disabled={busy}
          aria-busy={busy}
          onPointerDown={() => {
            pressingSubmit.current = true;
            document.addEventListener("pointerup", () => setTimeout(() => (pressingSubmit.current = false)), { once: true });
          }}
        >
          {busy ? TEXT.sending : "Отправить заявку"}
        </button>
        <div
          ref={statusRef}
          className={s.status}
          role="status"
          aria-live="polite"
          hidden={!status.message}
          data-state={status.state || undefined}
        >
          {status.state === "success" && <SuccessMark key={successCount} />}
          <p>{status.message}</p>
        </div>
      </div>
    </form>
  );
}
