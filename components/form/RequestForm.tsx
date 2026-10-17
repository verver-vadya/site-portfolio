"use client";

// Форма заявки (data-form): проверка ввода на русском и честная отправка в Formspree.
// «Спасибо» показываем только после ответа сервера; при ошибке данные остаются в полях.
// Без JS форма уходит обычным POST, а браузер сам проверяет обязательные поля.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { href, type Lang } from "@/lib/i18n";
import { owner } from "@/lib/site";
import { SuccessMark } from "./SuccessMark";
import { TEXTS, TIMEOUT_MS, validateField, type Field } from "./validate";
import s from "./RequestForm.module.css";

// Подписи формы на двух языках. Названия полей (name) остаются русскими: заявка приходит мне на почту.
// Варианты «Какой сайт нужен» совпадают с value тарифов на странице цен.
const L = {
  ru: {
    subject: "Заявка с сайта-портфолио",
    types: ["Лендинг", "Визитка или портфолио", "Сайт с записью или каталогом", "Пока не знаю"],
    terms: ["Нужно за 2–3 недели", "В течение месяца-двух", "Не горит", "Пока не знаю"],
    budgets: ["До 20 000 ₽", "20–40 тысяч ₽", "40–70 тысяч ₽", "Больше 70 тысяч ₽", "Пока не знаю"],
    name: <>Как к&nbsp;вам обращаться</>,
    nameErr: "Напишите, как к вам обращаться",
    contact: "Куда ответить",
    contactErr: "Напишите ник в Telegram, телефон или почту",
    contactHint: <>Ник в&nbsp;Telegram, телефон или почта</>,
    business: "Чем занимается бизнес",
    businessErr: "Пара слов о том, чем вы занимаетесь",
    businessHint: <>Например: салон стрижки в&nbsp;Казани, ремонт квартир</>,
    type: "Какой сайт нужен",
    typeErr: "Выберите, какой сайт нужен, или «Пока не знаю»",
    when: "Сроки",
    budget: "Бюджет",
    message: "Что ещё важно",
    optional: "(необязательно)",
    messageHint: <>Ссылка на&nbsp;сайт сейчас, примеры, которые нравятся, дата запуска</>,
    consentErr: "Без согласия на обработку данных я не могу принять заявку",
    consent: <>Даю согласие на&nbsp;обработку персональных данных по&nbsp;</>,
    policy: "политике конфиденциальности",
    send: "Отправить заявку",
  },
  en: {
    subject: "Заявка с сайта-портфолио (английская версия)",
    types: ["Landing page", "Business site or portfolio", "Site with booking or a catalogue", "Not sure yet"],
    terms: ["Needed in 2–3 weeks", "Within a month or two", "No rush", "Not sure yet"],
    budgets: ["Under $300", "$300–600", "$600–1,000", "Over $1,000", "Not sure yet"],
    name: "Your name",
    nameErr: "Please tell me what to call you",
    contact: "Where to reply",
    contactErr: "Enter a Telegram handle, phone number or email",
    contactHint: <>Telegram handle, phone number with country code or&nbsp;email</>,
    business: "What your business does",
    businessErr: "A couple of words about what you do",
    businessHint: <>For example: a&nbsp;hair salon in&nbsp;Berlin, apartment renovation</>,
    type: "What kind of site",
    typeErr: "Choose the kind of site, or “Not sure yet”",
    when: "Timeline",
    budget: "Budget",
    message: "Anything else",
    optional: "(optional)",
    messageHint: <>A&nbsp;link to&nbsp;your current site, examples you like, a&nbsp;launch date</>,
    consentErr: "I can’t accept the request without your consent to data processing",
    consent: <>I&nbsp;agree to&nbsp;the processing of&nbsp;my personal data under the&nbsp;</>,
    policy: "privacy policy",
    send: "Send request",
  },
};

// Порядок проверки = порядок полей; у групп переключателей ключ — id первого варианта
const KEYS = ["f-name", "f-contact", "f-business", "f-type", "f-when", "f-budget", "f-message", "f-consent"];

type Status = { state: "" | "error" | "success"; message: string };

export function RequestForm({ lang }: { lang: Lang }) {
  const t = L[lang];
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
    list.map((v, i) => (
      <label key={v} className={s.choice}>
        <input
          id={i === 0 ? key : undefined}
          type="radio"
          name={name}
          value={v}
          required={required || undefined}
          data-error-required={required ? t.typeErr : undefined}
          onChange={recheck(key)}
          {...aria(key)}
        />
        <span>{v}</span>
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
      <input type="hidden" name="_subject" value={t.subject} />

      <div className={s.field}>
        <label className="caps" htmlFor="f-name">
          {t.name}
        </label>
        <input
          id="f-name"
          name="Имя"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          data-error-required={t.nameErr}
          onBlur={leave("f-name")}
          onInput={recheck("f-name")}
          {...aria("f-name")}
        />
        {error("f-name")}
      </div>

      <div className={s.field}>
        <label className="caps" htmlFor="f-contact">
          {t.contact}
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
          data-error-required={t.contactErr}
          onBlur={leave("f-contact")}
          onInput={recheck("f-contact")}
          {...aria("f-contact", "f-contact-hint")}
        />
        <p className={`${s.hint} muted`} id="f-contact-hint">
          {t.contactHint}
        </p>
        {error("f-contact")}
      </div>

      <div className={`${s.field} ${s.wide}`}>
        <label className="caps" htmlFor="f-business">
          {t.business}
        </label>
        <input
          id="f-business"
          name="Бизнес"
          type="text"
          required
          minLength={3}
          data-error-required={t.businessErr}
          onBlur={leave("f-business")}
          onInput={recheck("f-business")}
          {...aria("f-business", "f-business-hint")}
        />
        <p className={`${s.hint} muted`} id="f-business-hint">
          {t.businessHint}
        </p>
        {error("f-business")}
      </div>

      <fieldset className={`${s.field} ${s.wide}`}>
        <legend className="caps">{t.type}</legend>
        <div className={s.choices}>{choices("f-type", "Какой сайт", t.types, true)}</div>
        {error("f-type")}
      </fieldset>

      <fieldset className={`${s.field} ${s.wide}`}>
        <legend className="caps">{t.when}</legend>
        <div className={s.choices}>{choices("f-when", "Сроки", t.terms)}</div>
      </fieldset>

      <fieldset className={`${s.field} ${s.wide}`}>
        <legend className="caps">{t.budget}</legend>
        <div className={s.choices}>{choices("f-budget", "Бюджет", t.budgets)}</div>
      </fieldset>

      <div className={`${s.field} ${s.wide}`}>
        <label className="caps" htmlFor="f-message">
          {t.message} <span className="muted">{t.optional}</span>
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
          {t.messageHint}
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
          data-error-required={t.consentErr}
          onChange={recheck("f-consent")}
          {...aria("f-consent")}
        />
        <label htmlFor="f-consent">
          {t.consent}
          <Link className={`link ${s.line}`} href={href(lang, "/privacy/")}>
            {t.policy}
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
          // не disabled: иначе фокус с кнопки слетает в начало страницы; повторное нажатие ловит sending
          aria-disabled={busy || undefined}
          aria-busy={busy}
          onPointerDown={() => {
            pressingSubmit.current = true;
            document.addEventListener("pointerup", () => setTimeout(() => (pressingSubmit.current = false)), { once: true });
          }}
        >
          {busy ? TEXT.sending : t.send}
        </button>
        <div
          ref={statusRef}
          className={s.status}
          // область всегда на месте (пустая без рамки): так экранный диктор зачитает ответ, когда он появится
          role="status"
          aria-live="polite"
          data-state={status.state || undefined}
        >
          {status.state === "success" && <SuccessMark key={successCount} />}
          <p>{status.message}</p>
        </div>
      </div>
    </form>
  );
}
