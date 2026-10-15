import Link from "next/link";

export const metadata = { title: "Страница не найдена · verver", description: "Такой страницы нет." };

export default function NotFound() {
  return (
    <section className="wrap" style={{ paddingBlock: "var(--s-24)" }}>
      <h1>Такой страницы нет</h1>
      <p style={{ marginTop: "var(--s-6)" }}>
        <Link className="btn" href="/">
          На главную
        </Link>
      </p>
    </section>
  );
}
