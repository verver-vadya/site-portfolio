import Link from "next/link";
import { getCases } from "@/lib/cases";
import { href, type Lang } from "@/lib/i18n";
import { roles } from "./roles";
import s from "./Clients.module.css";

// «Клиентам»: как собирается команда под проект. Цифры только настоящие:
// один договор, один ответственный и число работ в портфолио (считается по content/cases).
const pluralRu = (n: number, [one, few, many]: [string, string, string]) => {
  const form = new Intl.PluralRules("ru").select(n);
  return form === "one" ? one : form === "few" ? few : many;
};

const text = {
  ru: {
    label: "Клиентам",
    title: "Команда под ваш проект",
    lede: "Кому-то хватит меня одного, кому-то нужны 3D-художник и фотограф. Состав собираю под задачу, а для вас всё остаётся просто.",
    numbers: (works: number) => [
      ["1", "договор"],
      ["1", "ответственный"],
      [String(works), pluralRu(works, ["работа в портфолио", "работы в портфолио", "работ в портфолио"])],
    ],
    steps: [
      ["Бриф", "Разбираем задачу, сроки и бюджет. Без брифа не начинаю."],
      ["Команда", "Зову тех, кто нужен именно вашему проекту, и ни одного лишнего человека."],
      ["Договор", "Договор со мной одним, и за результат отвечаю я. С командой договариваюсь сам."],
      ["Сдача", "Домен, хостинг, код и лицензии оформлены на вас. Две недели бесплатных правок."],
    ],
    rolesLabel: "Кто бывает в команде",
    cta: "Обсудить проект",
  },
  en: {
    label: "For clients",
    title: "A team for your project",
    lede: "Some projects need just me, others need a 3D artist and a photographer. I put the team together for the task, and for you it stays simple.",
    numbers: (works: number) => [
      ["1", "contract"],
      ["1", "person in charge"],
      [String(works), works === 1 ? "portfolio case" : "portfolio cases"],
    ],
    steps: [
      ["Brief", "We go through the task, timeline and budget. I don’t start without a brief."],
      ["Team", "I bring in the people your project needs, and nobody extra."],
      ["Contract", "One contract with me, and I answer for the result. I handle the team."],
      ["Handover", "Domain, hosting, code and licences are in your name. Two weeks of free fixes."],
    ],
    rolesLabel: "Who can be on the team",
    cta: "Discuss a project",
  },
};

export function Clients({ lang }: { lang: Lang }) {
  const t = text[lang];
  const works = getCases(lang).length;
  return (
    <section id="clients" className={`${s.clients} wrap`} aria-labelledby="clients-title">
      <div className={s.head}>
        <p className={`${s.pill} caps`} data-reveal>
          {t.label}
        </p>
        <h2 id="clients-title" className={s.title} data-g-rise="">
          {t.title}
        </h2>
        <p className={`${s.lede} muted`} data-reveal>
          {t.lede}
        </p>
      </div>

      <ul className={s.numbers} data-g-cards="">
        {t.numbers(works).map(([n, label]) => (
          <li key={label}>
            <span className={s.num}>{n}</span>
            <span className="caps muted">{label}</span>
          </li>
        ))}
      </ul>

      <ol className={s.steps} data-g-cards="">
        {t.steps.map(([name, about], i) => (
          <li key={name} className={s.step}>
            <span className="caps muted">{String(i + 1).padStart(2, "0")}</span>
            <h3 className={s.stepName}>{name}</h3>
            <p className="muted">{about}</p>
          </li>
        ))}
      </ol>

      <div className={s.rolesBox}>
        <h3 className="caps muted" data-reveal>
          {t.rolesLabel}
        </h3>
        <ul className={s.roles} data-g-cards="">
          {roles[lang].map((r) => (
            <li key={r.id}>{r.name}</li>
          ))}
        </ul>
      </div>

      <div className={s.cta} data-reveal>
        <Link className="btn" href={href(lang, "/contact/")}>
          {t.cta}
        </Link>
      </div>
    </section>
  );
}
