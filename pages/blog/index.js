// pages/blog/index.js
import Link from "next/link";
import { getAllPostsMeta } from "../../lib/posts";

export async function getStaticProps() {
  const posts = getAllPostsMeta();
  return { props: { posts }, revalidate: 60 };
}

export default function BlogIndex({ posts }) {
  return (
    <main style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Latest Posts</h1>
      {!posts.length && <p>No posts yet.</p>}
      <ul>
        {posts.map(p => (
          <li key={p.slug} style={{ margin: "1rem 0" }}>
            <Link href={`/blog/${p.slug}`}>
              {p.title} {p.date ? `(${p.date})` : ""}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
        }
