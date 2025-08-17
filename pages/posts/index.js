// pages/posts/index.js
import Link from "next/link";
import { getAllPosts } from "../../lib/posts";

export async function getStaticProps() {
  const posts = getAllPosts();
  return { props: { posts } };
}

export default function PostsIndex({ posts }) {
  return (
    <main style={{maxWidth: 720, margin: "2rem auto", padding: "0 1rem"}}>
      <h1>Latest Posts</h1>
      {posts.length === 0 && <p>No posts yet.</p>}
      <ul>
        {posts.map(p => (
          <li key={p.slug} style={{marginBottom: "1rem"}}>
            <Link href={`/posts/${p.slug}`}><b>{p.title}</b></Link>
            {p.date ? <div style={{opacity:.7}}>{p.date}</div> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
