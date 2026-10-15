import Link from "next/link";
import { notFound } from "next/navigation";
import { Shot } from "@/components/Shot";
import { Cta } from "@/components/Cta";
import { getCase, getCases, statusLabel } from "@/lib/cases";
import { pageMeta } from "@/lib/meta";
import s from "./page.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCases().map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const c = getCase(slug);
  if (!c) return {};
  return pageMeta({
    title: `${c.title} — ${c.niche.toLowerCase()} · verver`,
    description: c.summary,
    path: `/cases/${c.slug}/`,
    image: `img/cases/${c.slug}/desktop-1-1440.webp`,
  });
}

export default async function CasePage({ params }: Props) {
  const { slug } = await params;
  const cases = getCases();
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
            alt={`«${c.title}»: первый экран сайта`}
            sizes="100vw"
            priority
            data-case-hero-img=""
          />
        </picture>
        <div className={s.scrim} aria-hidden="true" />
        <div className={s.heroText} data-case-hero-text="" data-overlap-ok="">
          <div className={`wrap ${s.heroIn}`}>
            <Link className={`${s.back} caps link`} href="/works/">
              ← Все работы
            </Link>
            <div className={s.heroMain}>
              <h1 className={s.title}>{c.title}</h1>
              <p className={s.heroMeta}>
                <span>
                  {c.niche} · {c.city} · {c.year}
                </span>
                <span className="tag caps">{statusLabel[c.status]}</span>
              </p>
            </div>
            <div className={s.actions}>
              {c.live ? (
                <a className={`btn ${s.open}`} href={c.url} target="_blank" rel="noopener">
                  Открыть сайт ↗
                </a>
              ) : (
                <p className={s.soon}>превью появится после запуска</p>
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
                <dt className="caps muted">Ниша</dt>
                <dd>{c.niche}</dd>
              </div>
              <div>
                <dt className="caps muted">Город</dt>
                <dd>{c.city}</dd>
              </div>
              <div>
                <dt className="caps muted">Год</dt>
                <dd>{c.year}</dd>
              </div>
              {c.term && (
                <div>
                  <dt className="caps muted">Срок</dt>
                  <dd>{c.term}</dd>
                </div>
              )}
              <div className={s.factWide}>
                <dt className="caps muted">Формат</dt>
                <dd>{c.status === "concept" ? "Концепт: учебная работа без заказчика" : statusLabel[c.status]}</dd>
              </div>
              <div className={s.factWide}>
                <dt className="caps muted">Сайт</dt>
                <dd>
                  {c.live ? (
                    <a className={`link ${s.url}`} href={c.url} target="_blank" rel="noopener">
                      {host}&nbsp;↗
                    </a>
                  ) : (
                    <span className="muted">превью появится после запуска</span>
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
                alt={`«${c.title}» на компьютере, экран ${n + 2}`}
                sizes="(max-width: 720px) 86vw, min(88vw, 1900px)"
              />
            </figure>
          ))}

          <ul className={`${s.plate} ${s.phones}`} data-reveal>
            {c.phone.map((im, n) => (
              <li key={im.id} className={s.phone}>
                <Shot
                  img={im}
                  alt={`«${c.title}» на телефоне, экран ${n + 1}`}
                  sizes="(max-width: 720px) 60vw, 24vw"
                />
              </li>
            ))}
          </ul>

          {next.slug !== c.slug && (
            <Link className={s.next} href={`/cases/${next.slug}/`} data-cursor="open" data-reveal>
              <span className={s.nextText}>
                <span className="caps muted">Следующая работа</span>
                <span className={s.nextTitle}>{next.title}&nbsp;→</span>
                <span className="muted">
                  {next.niche}, {next.city}, {next.year}
                </span>
              </span>
              <span className={s.nextPlate}>
                <Shot
                  className={s.nextShot}
                  img={next.desktop[0]}
                  alt={`«${next.title}» на компьютере`}
                  sizes="(max-width: 720px) 86vw, 32vw"
                />
              </span>
            </Link>
          )}
        </article>

        <Cta
          links={[
            { label: "Все работы", to: "/works/" },
            { label: "Цены и сроки", to: "/prices/" },
          ]}
        />
      </div>
    </>
  );
}
