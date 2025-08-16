// /pages/index.js
import Link from "next/link";
import { safeFetch } from "../lib/sanity";

const LATEST3 = /* groq */ `
*[_type == "post"] | order(publishedAt desc)[0...3]{
  _id,
  title,
  "slug": slug.current,
  publishedAt
}
`;

export default function Home({ posts }) {
  return (
    <main style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
      <section style={{ padding: "2rem 1.5rem", background: "#f7fafc", borderRadius: 16, marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: ".5rem" }}>
          Prep smarter for NEET PG · INI-CET · FMGE
        </h1>
        <p style={{ color: "#555", marginBottom: "1rem" }}>
          Daily practice MCQs, PYQs with crisp explanations, and timely exam updates—curated by your AI Website Manager.
        </p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/blog" style={{ padding: ".75rem 1rem", background: "black", color: "white", borderRadius: 10 }}>
            Browse Blog
          </Link>
          <Link href="/blog" style={{ padding: ".75rem 1rem", border: "1px solid #ddd", borderRadius: 10 }}>
            Latest Updates
          </Link>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "1rem" }}>
          Latest Posts
        </h2>
        {posts.length === 0 && <p>No posts yet.</p>}
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {posts.map((p) => (
            <li key={p._id} style={{ borderBottom: "1px solid #eee", padding: "0.75rem 0" }}>
              <Link href={`/blog/${p.slug}`} style={{ fontWeight: 700 }}>
                {p.title}
              </Link>
              <div style={{ color: "#666" }}>
                {p.publishedAt ? new Date(p.publishedAt).toISOString().slice(0, 10) : ""}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export async function getStaticProps() {
  const posts = (await safeFetch(LATEST3)) || [];
  return { props: { posts }, revalidate: 60 };
}
