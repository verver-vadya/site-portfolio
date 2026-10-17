import type { Lang } from "@/lib/i18n";
import s from "./Faq.module.css";

// Неразрывный пробел после коротких слов, как в старой вёрстке
const nb = (t: string) => t.replace(/(^|[\s(«])([а-яёА-ЯЁ]{1,2})\s/g, "$1$2 ").replace(/(^|[\s(«])([а-яёА-ЯЁ]{1,2})\s/g, "$1$2 ").replace(/ %/g, " %");

// Вопросы и ответы: что нужно от клиента, правки, на кого оформлено, цена и оплата, что после запуска
const itemsRu = [
  {
    q: "Что нужно от вас",
    a: "Ответить на вопросы брифа, это минут пятнадцать, и прислать фото работ, если они есть. Тексты напишу сам по вашим ответам, вы их только поправите. Если сайт держится на картинках, как у салонов и мастеров, посоветую сделать съёмку: она сильнее всего влияет на вид сайта.",
  },
  {
    q: "Сколько будет правок",
    a: "Два-три круга на каждом этапе: после прототипа главной и после сборки всего сайта. Вы смотрите живую ссылку на компьютере и телефоне и присылаете замечания списком.",
  },
  {
    q: "На кого оформлены сайт, хостинг и домен",
    a: "На вас. Хостинг и домен вы покупаете на своё имя, я помогаю по шагам. После запуска передаю код и доступы, вы меняете пароли. Сайт не привязан ко мне.",
  },
  {
    q: "От чего зависит цена",
    a: "От количества страниц, от того, есть ли у вас тексты и фото, и от того, нужны ли запись, каталог или оплата на сайте. Лендинг с готовыми текстами и фото ближе к нижней границе, сайт с записью и админкой ближе к верхней.",
  },
  {
    q: "Почему нельзя сразу назвать точную цену",
    a: "До брифа непонятен объём: сколько страниц, кто пишет тексты, нужна ли запись. После брифа называю точную цену, она попадает в договор и дальше не меняется, если не меняется задача.",
  },
  {
    q: "Как проходит оплата",
    a: "Договор и предоплата 30–50 % перед началом, остаток после запуска. Первым делом я делаю прототип главной. Если он не понравится, верну предоплату целиком, и мы спокойно разойдёмся.",
  },
  {
    q: "Что будет после запуска",
    a: "Две недели бесплатно исправляю всё, что всплывёт. Дальше по желанию поддержка: правки текстов и цен, новые страницы, обновления. Или обновляете сами: для текстов и цен делаю простую админку или пишу инструкцию.",
  },
  {
    q: "У меня уже есть сайт",
    a: "Посмотрю, что в нём работает, а что мешает заявкам. Иногда хватает новой главной и нормальной формы, тогда так и скажу.",
  },
];

const itemsEn: typeof itemsRu = [
  {
    q: "What I need from you",
    a: "Answers to the brief questions, about fifteen minutes, and photos of your work if you have them. I write the texts from your answers, you only correct them. If the site relies on pictures, as with salons and craftspeople, I’ll suggest a photo shoot: it affects the look of the site more than anything else.",
  },
  {
    q: "How many rounds of changes",
    a: "Two or three rounds at each stage: after the homepage prototype and after the whole site is built. You check a live link on desktop and phone and send your notes as a list.",
  },
  {
    q: "Who owns the site, hosting and domain",
    a: "You do. You buy hosting and the domain in your own name, I help step by step. After launch I hand over the code and access, and you change the passwords. The site isn’t tied to me.",
  },
  {
    q: "What the price depends on",
    a: "The number of pages, whether you have texts and photos, and whether you need booking, a catalogue or payments on the site. A landing page with ready texts and photos is closer to the lower end, a site with booking and an admin panel closer to the upper end.",
  },
  {
    q: "Why I can’t name an exact price right away",
    a: "Before the brief the scope is unclear: how many pages, who writes the texts, whether booking is needed. After the brief I name an exact price, it goes into the contract and doesn’t change unless the task changes.",
  },
  {
    q: "How payment works",
    a: "A contract and 30–50% upfront before the start, the rest after launch. The first thing I make is the homepage prototype. If you don’t like it, I refund the prepayment in full and we part on good terms.",
  },
  {
    q: "What happens after launch",
    a: "For two weeks I fix anything that comes up for free. After that, support if you want it: text and price updates, new pages, upgrades. Or you update things yourself: for texts and prices I set up a simple admin panel or write instructions.",
  },
  {
    q: "I already have a site",
    a: "I’ll look at what works in it and what gets in the way of requests. Sometimes a new homepage and a proper form are enough, and then I’ll say so.",
  },
];

const title = { ru: "Вопросы", en: "Questions" };

export function Faq({ lang }: { lang: Lang }) {
  const items = lang === "en" ? itemsEn : itemsRu;
  const fix = lang === "en" ? (x: string) => x : nb;
  return (
    <section className={`${s.faq} wrap`} id="faq" aria-labelledby="faq-title">
      <h2 id="faq-title" className={s.title} data-reveal>
        {title[lang]}
      </h2>
      <div className={s.list}>
        {items.map((it, i) => (
          <details key={it.q} className={s.item} data-reveal style={{ "--reveal-i": Math.min(i, 4) } as React.CSSProperties}>
            <summary className={s.q}>
              <span>{fix(it.q)}</span>
              <span className={s.mark} aria-hidden="true" />
            </summary>
            <p className={s.a}>{fix(it.a)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
