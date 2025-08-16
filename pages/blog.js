// /pages/blog.js
import Link from "next/link";
import { safeFetch } from "../lib/sanity";

const POSTS_QUERY = /* groq */ `
*[_type == "post"] | order(publishedAt desc)[0...20]{
  _id,
  title,
  "slug": slug.current,
  publishedAt
}
`;

export default function Blog({ posts }) {
  return (
    <main style={{ maxWidth: 800, margin: "3rem auto", padding: "0 1rem" }}>
      <h1 style={{ fontSize: "3rem", fontWeight: 800, marginBottom: "2rem" }}>
        Latest Posts
      </h1>

      {posts.length === 0 && <p>No posts yet.</p>}

      {posts.map((p) => (
        <article key={p._id} style={{ marginBottom: "1.25rem", borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, margin: 0 }}>
            <Link href={`/blog/${p.slug}`}>{p.title}</Link>
          </h2>
          <div style={{ color: "#666", marginTop: ".25rem" }}>
            {p.publishedAt ? new Date(p.publishedAt).toISOString().slice(0, 10) : ""}
          </div>
        </article>
      ))}
    </main>
  );
}

export async function getStaticProps() {
  const posts = (await safeFetch(POSTS_QUERY)) || [];
  return {
    props: { posts },
    revalidate: 60, // ISR
  };
}
