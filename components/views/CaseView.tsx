import Link from "next/link";
import { notFound } from "next/navigation";
import { Shot } from "@/components/Shot";
import { Cta } from "@/components/Cta";
import { getCases } from "@/lib/cases";
import { dict } from "@/lib/dict";
import { href, type Lang } from "@/lib/i18n";
import s from "@/app/cases/[slug]/page.module.css";

const text = {
  ru: {
    allWorks: "← Все работы",
    openSite: "Открыть сайт ↗",
    soon: "превью появится после запуска",
    niche: "Ниша",
    city: "Город",
    year: "Год",
    term: "Срок",
    format: "Формат",
    concept: "Концепт: учебная работа без заказчика",
    site: "Сайт",
    next: "Следующая работа",
    altHero: (t: string) => `«${t}»: первый экран сайта`,
    altDesktop: (t: string, n: number) => `«${t}» на компьютере, экран ${n}`,
    altPhone: (t: string, n: number) => `«${t}» на телефоне, экран ${n}`,
    altNext: (t: string) => `«${t}» на компьютере`,
  },
  en: {
    allWorks: "← All work",
    openSite: "Open the site ↗",
    soon: "preview after launch",
    niche: "Niche",
    city: "City",
    year: "Year",
    term: "Time",
    format: "Format",
    concept: "Concept: a practice project without a client",
    site: "Site",
    next: "Next project",
    altHero: (t: string) => `“${t}”: the first screen of the site`,
    altDesktop: (t: string, n: number) => `“${t}” on desktop, screen ${n}`,
    altPhone: (t: string, n: number) => `“${t}” on a phone, screen ${n}`,
    altNext: (t: string) => `“${t}” on desktop`,
  },
};

export function CaseView({ slug, lang }: { slug: string; lang: Lang }) {
  const t = text[lang];
  const d = dict[lang];
  const cases = getCases(lang);
  const i = cases.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const c = cases[i];
  const next = cases[(i + 1) % cases.length];
  const u = new URL(c.url);
  const host = u.host + u.pathname.replace(/\/$/, "");
  const reveal = (n: number) => ({ "--reveal-i": n }) as React.CSSProperties;

  return (
    <>
      {/* Первый экран: сюда раскрывается панель кольца из 3D-сцены, размеры и кадр картинки не менять */}
      <section className={s.hero} data-case-hero={c.slug}>
        {/* на вертикальном экране первый экран с телефона: им же заканчивается раскрытие панели кольца */}
        <picture>
          <source
            media="(max-aspect-ratio: 4/5)"
            srcSet={c.phone[0].srcSet}
            sizes="100vw"
            width={c.phone[0].width}
            height={c.phone[0].height}
          />
          <Shot
            className={s.heroImg}
            img={c.desktop[0]}
            alt={t.altHero(c.title)}
            sizes="100vw"
            priority
            data-case-hero-img=""
          />
        </picture>
        <div className={s.scrim} aria-hidden="true" />
        <div className={s.heroText} data-case-hero-text="" data-overlap-ok="">
          <div className={`wrap ${s.heroIn}`}>
            <Link className={`${s.back} caps link`} href={href(lang, "/works/")}>
              {t.allWorks}
            </Link>
            <div className={s.heroMain}>
              <h1 className={s.title}>{c.title}</h1>
              <p className={s.heroMeta}>
                <span>
                  {c.niche} · {c.city} · {c.year}
                </span>
                <span className="tag caps">{d.status[c.status]}</span>
              </p>
            </div>
            <div className={s.actions}>
              {c.live ? (
                <a className={`btn ${s.open}`} href={c.url} target="_blank" rel="noopener">
                  {t.openSite}
                </a>
              ) : (
                <p className={s.soon}>{t.soon}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className={s.content}>
        <article className={`wrap ${s.body}`}>
          <div className={s.intro}>
            <p className={s.summary} data-reveal>
              {c.summary}
            </p>
            <dl className={s.facts} data-reveal style={reveal(1)}>
              <div>
                <dt className="caps muted">{t.niche}</dt>
                <dd>{c.niche}</dd>
              </div>
              <div>
                <dt className="caps muted">{t.city}</dt>
                <dd>{c.city}</dd>
              </div>
              <div>
                <dt className="caps muted">{t.year}</dt>
                <dd>{c.year}</dd>
              </div>
              {c.term && (
                <div>
                  <dt className="caps muted">{t.term}</dt>
                  <dd>{c.term}</dd>
                </div>
              )}
              <div className={s.factWide}>
                <dt className="caps muted">{t.format}</dt>
                <dd>{c.status === "concept" ? t.concept : d.status[c.status]}</dd>
              </div>
              <div className={s.factWide}>
                <dt className="caps muted">{t.site}</dt>
                <dd>
                  {c.live ? (
                    <a className={`link ${s.url}`} href={c.url} target="_blank" rel="noopener">
                      {host}&nbsp;↗
                    </a>
                  ) : (
                    <span className="muted">{t.soon}</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className={s.prose} data-reveal dangerouslySetInnerHTML={{ __html: c.html }} />

          {c.desktop.slice(1).map((im, n) => (
            <figure key={im.id} className={s.plate} data-reveal>
              <Shot
                className={s.wide}
                img={im}
                alt={t.altDesktop(c.title, n + 2)}
                sizes="(max-width: 720px) 86vw, min(88vw, 1900px)"
              />
            </figure>
          ))}

          <ul className={`${s.plate} ${s.phones}`} data-reveal>
            {c.phone.map((im, n) => (
              <li key={im.id} className={s.phone}>
                <Shot
                  img={im}
                  alt={t.altPhone(c.title, n + 1)}
                  sizes="(max-width: 720px) 60vw, 24vw"
                />
              </li>
            ))}
          </ul>

          {next.slug !== c.slug && (
            <Link className={s.next} href={href(lang, `/cases/${next.slug}/`)} data-cursor="open" data-reveal>
              <span className={s.nextText}>
                <span className="caps muted">{t.next}</span>
                <span className={s.nextTitle}>{next.title}&nbsp;→</span>
                <span className="muted">
                  {next.niche}, {next.city}, {next.year}
                </span>
              </span>
              <span className={s.nextPlate}>
                <Shot
                  className={s.nextShot}
                  img={next.desktop[0]}
                  alt={t.altNext(next.title)}
                  sizes="(max-width: 720px) 86vw, 32vw"
                />
              </span>
            </Link>
          )}
        </article>

        <Cta
          lang={lang}
          links={[
            { label: d.cta.allWorks, to: href(lang, "/works/") },
            { label: d.cta.prices, to: href(lang, "/prices/") },
          ]}
        />
      </div>
    </>
  );
}
