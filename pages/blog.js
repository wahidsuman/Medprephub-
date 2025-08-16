// pages/blog.js
import Link from "next/link";
import { safeFetch } from "../lib/sanity";

export default function Blog({ posts }) {
  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 16 }}>Latest Posts</h1>

      {(!posts || posts.length === 0) && (
        <p>No posts yet. Try seeding via <code>/api/seed</code> or add content in Sanity.</p>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {posts.map((p) => (
          <li key={p._id} style={{ padding: "12px 0", borderBottom: "1px solid #eee" }}>
            <Link href={`/blog/${p.slug?.current || ""}`} style={{ textDecoration: "none" }}>
              <h3 style={{ margin: 0 }}>{p.title || "(Untitled)"}</h3>
            </Link>
            <small style={{ color: "#666" }}>{p._createdAt?.slice(0, 10)}</small>
          </li>
        ))}
      </ul>
    </main>
  );
}

export async function getStaticProps() {
  const query = `
    *[_type == "post"] | order(_createdAt desc) [0..19]{
      _id, title, slug, _createdAt
    }
  `;
  const posts = (await safeFetch(query)) || [];
  return {
    props: { posts },
    revalidate: 60, // ISR: refresh every 60s
  };
}
