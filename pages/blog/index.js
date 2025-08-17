// pages/blog/index.js
import Link from "next/link";
import { getAllPosts } from "../../lib/posts";

export async function getStaticProps() {
  const posts = getAllPosts();
  return { props: { posts }, revalidate: 60 };
}

export default function BlogIndex({ posts }) {
  return (
    <main style={{maxWidth: 720, margin: "40px auto", padding: "0 16px"}}>
      <h1>Latest Posts</h1>
      <ul style={{listStyle: "none", padding: 0}}>
        {posts.map(p => (
          <li key={p.slug} style={{margin: "18px 0"}}>
            <Link href={`/blog/${p.slug}`} style={{fontSize: 22}}>
              {p.title}
            </Link>
            {p.date && (
              <div style={{fontSize: 13, opacity: 0.7}}>
                {new Date(p.date).toLocaleDateString()}
              </div>
            )}
          </li>
        ))}
        {posts.length === 0 && <li>No posts yet.</li>}
      </ul>
    </main>
  );
        }
