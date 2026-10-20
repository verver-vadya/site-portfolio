"use client";

// Форма «Хочу в объединение». Та же проверка и отправка, что у заявки (useForm),
// в Formspree уходит с темой письма «Заявка в объединение».
// Кнопка «Откликнуться» на карточке роли (data-pick-role) ведёт к форме и сразу отмечает эту роль.

import Link from "next/link";
import { useEffect } from "react";
import { href, type Lang } from "@/lib/i18n";
import { owner } from "@/lib/site";
import { SuccessMark } from "@/components/form/SuccessMark";
import { useForm } from "@/components/form/useForm";
import s from "@/components/form/RequestForm.module.css";
import type { Role } from "./roles";

const L = {
  ru: {
    subject: "Заявка в объединение",
    name: <>Как к&nbsp;вам обращаться</>,
    nameErr: "Напишите, как к вам обращаться",
    contact: "Куда ответить",
    contactErr: "Напишите ник в Telegram, телефон или почту",
    contactHint: <>Ник в&nbsp;Telegram, телефон или почта</>,
    portfolio: "Ссылка на работы",
    portfolioErr: "Нужна ссылка на портфолио или сайт с вашими работами",
    portfolioHint: <>Behance, Dribbble, GitHub, свой сайт или папка с&nbsp;работами</>,
    role: "Роль",
    roleErr: "Выберите роль или «Другое»",
    other: "Другое",
    about: "Пара слов о себе",
    optional: "(необязательно)",
    aboutHint: <>Опыт, любимые проекты, сколько времени готовы уделять</>,
    consentErr: "Без согласия на обработку данных я не могу принять заявку",
    consent: <>Даю согласие на&nbsp;обработку персональных данных по&nbsp;</>,
    policy: "политике конфиденциальности",
    send: "Отправить",
  },
  en: {
    subject: "Заявка в объединение (английская версия)",
    name: "Your name",
    nameErr: "Please tell me what to call you",
    contact: "Where to reply",
    contactErr: "Enter a Telegram handle, phone number or email",
    contactHint: <>Telegram handle, phone number with country code or&nbsp;email</>,
    portfolio: "Link to your work",
    portfolioErr: "Please add a link to your portfolio or a site with your work",
    portfolioHint: <>Behance, Dribbble, GitHub, your own site or a&nbsp;folder of&nbsp;work</>,
    role: "Role",
    roleErr: "Choose a role or “Other”",
    other: "Other",
    about: "A few words about you",
    optional: "(optional)",
    aboutHint: <>Experience, favourite projects, how much time you can give</>,
    consentErr: "I can’t accept the application without your consent to data processing",
    consent: <>I&nbsp;agree to&nbsp;the processing of&nbsp;my personal data under the&nbsp;</>,
    policy: "privacy policy",
    send: "Send",
  },
};

const KEYS = ["j-name", "j-contact", "j-portfolio", "j-role", "j-about", "j-consent"];

export function JoinForm({ lang, roles }: { lang: Lang; roles: Role[] }) {
  const t = L[lang];
  const { TEXT, formRef, statusRef, busy, status, successCount, leave, recheck, aria, error, submit, onSubmitPress } =
    useForm(lang, KEYS);

  useEffect(() => {
    const pick = (e: MouseEvent) => {
      const a = (e.target as Element).closest<HTMLAnchorElement>("a[data-pick-role]");
      if (!a) return;
      const radio = formRef.current!.querySelector<HTMLInputElement>(`input[data-role="${CSS.escape(a.dataset.pickRole!)}"]`);
      if (radio) radio.checked = true;
      // на компьютере к форме плавно везёт Lenis, на телефоне — браузер
      if (document.documentElement.classList.contains("lenis")) return;
      e.preventDefault();
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.querySelector(a.hash)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    };
    document.addEventListener("click", pick);
    return () => document.removeEventListener("click", pick);
  }, [formRef]);

  const options = [...roles.map((r) => ({ id: r.id, name: r.name })), { id: "other", name: t.other }];

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
        <label className="caps" htmlFor="j-name">
          {t.name}
        </label>
        <input
          id="j-name"
          name="Имя"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          data-error-required={t.nameErr}
          onBlur={leave("j-name")}
          onInput={recheck("j-name")}
          {...aria("j-name")}
        />
        {error("j-name")}
      </div>

      <div className={s.field}>
        <label className="caps" htmlFor="j-contact">
          {t.contact}
        </label>
        <input
          id="j-contact"
          name="Контакт"
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          required
          data-validate="contact"
          data-error-required={t.contactErr}
          onBlur={leave("j-contact")}
          onInput={recheck("j-contact")}
          {...aria("j-contact", "j-contact-hint")}
        />
        <p className={`${s.hint} muted`} id="j-contact-hint">
          {t.contactHint}
        </p>
        {error("j-contact")}
      </div>

      <div className={`${s.field} ${s.wide}`}>
        <label className="caps" htmlFor="j-portfolio">
          {t.portfolio}
        </label>
        <input
          id="j-portfolio"
          name="Портфолио"
          type="text"
          inputMode="url"
          autoComplete="url"
          autoCapitalize="off"
          spellCheck={false}
          required
          data-validate="url"
          data-error-required={t.portfolioErr}
          onBlur={leave("j-portfolio")}
          onInput={recheck("j-portfolio")}
          {...aria("j-portfolio", "j-portfolio-hint")}
        />
        <p className={`${s.hint} muted`} id="j-portfolio-hint">
          {t.portfolioHint}
        </p>
        {error("j-portfolio")}
      </div>

      <fieldset className={`${s.field} ${s.wide}`}>
        <legend className="caps">{t.role}</legend>
        <div className={s.choices}>
          {options.map((r, i) => (
            <label key={r.id} className={s.choice}>
              <input
                id={i === 0 ? "j-role" : undefined}
                type="radio"
                name="Роль"
                value={r.name}
                data-role={r.id}
                required
                data-error-required={t.roleErr}
                onChange={recheck("j-role")}
                {...aria("j-role")}
              />
              <span>{r.name}</span>
            </label>
          ))}
        </div>
        {error("j-role")}
      </fieldset>

      <div className={`${s.field} ${s.wide}`}>
        <label className="caps" htmlFor="j-about">
          {t.about} <span className="muted">{t.optional}</span>
        </label>
        <textarea
          id="j-about"
          name="О себе"
          rows={4}
          maxLength={2000}
          onBlur={leave("j-about")}
          onInput={recheck("j-about")}
          {...aria("j-about", "j-about-hint")}
        />
        <p className={`${s.hint} muted`} id="j-about-hint">
          {t.aboutHint}
        </p>
        {error("j-about")}
      </div>

      <div className={`${s.field} ${s.wide} ${s.check}`}>
        <input
          id="j-consent"
          name="Согласие"
          type="checkbox"
          value="да"
          required
          data-error-required={t.consentErr}
          onChange={recheck("j-consent")}
          {...aria("j-consent")}
        />
        <label htmlFor="j-consent">
          {t.consent}
          <Link className={`link ${s.line}`} href={href(lang, "/privacy/")}>
            {t.policy}
          </Link>
        </label>
        {error("j-consent", true)}
      </div>

      {/* Ловушка для спам-ботов: человек это поле не видит */}
      <input className={s.trap} type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <div className={`${s.send} ${s.wide}`}>
        <button className="btn" type="submit" aria-disabled={busy || undefined} aria-busy={busy} onPointerDown={onSubmitPress}>
          {busy ? TEXT.sending : t.send}
        </button>
        <div ref={statusRef} className={s.status} role="status" aria-live="polite" data-state={status.state || undefined}>
          {status.state === "success" && <SuccessMark key={successCount} />}
          <p>{status.message}</p>
        </div>
      </div>
    </form>
  );
}
