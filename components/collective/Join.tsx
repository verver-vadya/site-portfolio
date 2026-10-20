import type { Lang } from "@/lib/i18n";
import { JoinForm } from "./JoinForm";
import { openRoles, roles } from "./roles";
import s from "./Join.module.css";

// «Ищем в объединение»: открытые роли со счётчиком и форма вступления.
// Честно: зову в проекты, когда нужна ваша часть, постоянную загрузку не обещаю.
const pluralRu = (n: number, [one, few, many]: [string, string, string]) => {
  const form = new Intl.PluralRules("ru").select(n);
  return form === "one" ? one : form === "few" ? few : many;
};

const text = {
  ru: {
    label: "Ищем в объединение",
    title: "Ищу сильных людей в команду",
    lede: "Зову в проекты, когда нужна ваша часть работы. Работаем удалённо, оплата за каждый проект, договор со мной.",
    count: (n: number) => pluralRu(n, ["открытая роль", "открытые роли", "открытых ролей"]),
    format: "Удалённо · оплата за проект",
    apply: "Откликнуться",
    formTitle: "Хочу в\u00a0объединение",
    formLede: "Покажите работы и выберите роль. Отвечу в течение пары дней туда, куда вы укажете.",
  },
  en: {
    label: "Joining the collective",
    title: "Looking for strong people",
    lede: "I bring people into projects when their part of the work is needed. Remote work, paid per project, with a contract with me.",
    count: (n: number) => (n === 1 ? "open role" : "open roles"),
    format: "Remote · paid per project",
    apply: "Apply",
    formTitle: "I want to join",
    formLede: "Show your work and pick a role. I’ll reply within a couple of days wherever you say.",
  },
};

export function Join({ lang }: { lang: Lang }) {
  const t = text[lang];
  const open = openRoles(lang);
  return (
    <section id="join" className={`${s.join} wrap`} aria-labelledby="join-title">
      <div className={s.head}>
        <p className={`${s.pill} caps`} data-reveal>
          {t.label}
        </p>
        <h2 id="join-title" className={s.title} data-g-rise="">
          {t.title}
        </h2>
        <p className={s.count} data-reveal>
          <span className={s.num}>{open.length}</span>
          <span className="caps muted">{t.count(open.length)}</span>
        </p>
        <p className={`${s.lede} muted`} data-reveal>
          {t.lede}
        </p>
      </div>

      <ul className={s.roles} data-g-cards="">
        {open.map((r) => (
          <li key={r.id} className={s.role}>
            <div className={s.roleTop}>
              <h3 className={s.roleName}>{r.name}</h3>
              <p className="muted">{r.about}</p>
            </div>
            <div className={s.roleBottom}>
              <span className="caps muted">{t.format}</span>
              <a className={`${s.apply} caps`} href="#join-form" data-pick-role={r.id}>
                {t.apply}
                <span className="visually-hidden">: {r.name.toLowerCase()}</span>
              </a>
            </div>
          </li>
        ))}
      </ul>

      <div id="join-form" className={s.formBox}>
        <div className={s.formHead}>
          <h3 className={s.formTitle} data-g-rise="">
            {t.formTitle}
          </h3>
          <p className="muted" data-reveal>
            {t.formLede}
          </p>
        </div>
        <JoinForm lang={lang} roles={roles[lang]} />
      </div>
    </section>
  );
}
