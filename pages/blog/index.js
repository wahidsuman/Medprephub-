// pages/blog/index.js
import Link from "next/link";
import { getAllPosts } from "../../lib/posts";

export async function getStaticProps() {
  const posts = getAllPosts();
  return {
    props: { posts },
    revalidate: 60, // ISR
  };
}

export default function BlogIndex({ posts }) {
  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
      <h1>Latest Posts</h1>
      {posts.length === 0 && <p>No posts yet.</p>}
      <ul>
        {posts.map((p) => (
          <li key={p.slug} style={{ margin: "12px 0" }}>
            <Link href={`/blog/${p.slug}`}>{p.title}</Link>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{p.date}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
