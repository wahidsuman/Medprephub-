// pages/index.js
import Link from "next/link";
import { listPosts } from "../lib/posts"; // same helper used by /posts

export default function Home({ posts }) {
  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Prep smarter for NEET PG · INI-CET · FMGE</h1>

      <p>
        Daily practice MCQs, PYQs with crisp explanations, and timely exam
        updates—curated by your AI Website Manager.
      </p>

      <p>
        <Link href="/posts"><strong>Browse Blog</strong></Link>
        {" · "}
        <Link href="/posts"><strong>Latest Updates</strong></Link>
      </p>

      <h2>Latest Posts</h2>
      <ul>
        {posts.map(p => (
          <li key={p.slug}>
            <Link href={`/posts/${p.slug}`}>{p.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

export async function getStaticProps() {
  const posts = await listPosts();  // reads /content/posts/*.md
  return { props: { posts } };
}
