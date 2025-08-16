// pages/blog.js
import Head from "next/head";
import Link from "next/link";
import { safeFetch } from "../lib/sanity";

export default function BlogPage({ posts = [] }) {
  return (
    <>
      <Head>
        <title>Blog | Medprephub</title>
        <meta name="description" content="Latest posts generated & managed by your AI admin." />
      </Head>

      <main style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
        <h1 style={{ fontSize: "2.25rem", marginBottom: "0.5rem" }}>Blog</h1>
        <p>Latest posts generated & managed by your AI admin.</p>
        <hr style={{ margin: "1rem 0" }} />

        {posts.length === 0 ? (
          <p>No posts yet. Try hitting <code>/api/seed</code> once, then refresh this page.</p>
        ) : (
          <ul style={{ lineHeight: 1.6 }}>
            {posts.map((p) => (
              <li key={p._id}>
                <Link href={`/blog/${p.slug?.current || p.slug}`}>{p.title}</Link>
                <div style={{ color: "#666", fontSize: "0.9rem" }}>{p.excerpt || ""}</div>
              </li>
            ))}
          </ul>
        )}

        <p style={{ marginTop: "2rem" }}>
          ← <Link href="/">Back to home</Link>
        </p>
      </main>
    </>
  );
}

export async function getStaticProps() {
  // Fetch latest posts; if anything fails, safeFetch returns []
  const query = `*[_type == "post"] | order(_createdAt desc)[0...20]{
    _id, title, "slug": slug, excerpt
  }`;
  const posts = (await safeFetch(query)) || [];

  return {
    props: { posts },
    revalidate: 60, // ISR
  };
}
