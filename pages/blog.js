// pages/blog.js
import Link from "next/link";
import { client } from "../lib/sanity";

const query = `
*[_type == "post"] | order(coalesce(publishedAt, _createdAt) desc)[0..19]{
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  excerpt
}
`;

export async function getStaticProps() {
  try {
    const posts = await client.fetch(query);
    return { props: { posts }, revalidate: 60 }; // ISR: refresh every 60s
  } catch (e) {
    console.error("Sanity fetch error:", e);
    return { props: { posts: [] }, revalidate: 60 };
  }
}

export default function Blog({ posts }) {
  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 36, marginBottom: 10 }}>Blog</h1>
      <p style={{ color: "#555", marginBottom: 24 }}>
        Latest posts generated & managed by your AI admin.
      </p>

      {(!posts || posts.length === 0) && (
        <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 8 }}>
          No posts yet. Try visiting <code>/api/seed</code> once, then refresh.
        </div>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {posts.map((p) => (
          <li key={p._id} style={{ padding: "16px 0", borderBottom: "1px solid #eee" }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 22 }}>
              <Link href={`/post/${p.slug || p._id}`}>{p.title || "Untitled post"}</Link>
            </h2>
            <div style={{ color: "#777", fontSize: 13, marginBottom: 6 }}>
              {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : ""}
            </div>
            <p style={{ margin: 0, color: "#333" }}>
              {p.excerpt || "—"}
            </p>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 24 }}>
        <Link href="/" style={{ textDecoration: "underline" }}>← Back to home</Link>
      </div>
    </div>
  );
            }
