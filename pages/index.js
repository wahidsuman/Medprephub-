
import Link from "next/link";
import { getAllPosts } from "../lib/posts";

export default function Home({ posts }) {
  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
      <header>
        <h1>🩺 MedPrepHub - NEET PG · INI-CET · FMGE</h1>
        <p>
          Daily practice MCQs, PYQs with crisp explanations, and timely exam
          updates—curated by your AI Website Manager.
        </p>
      </header>

      <nav style={{ margin: "2rem 0" }}>
        <Link href="/posts" style={{ marginRight: "1rem", textDecoration: "none", background: "#007acc", color: "white", padding: "0.5rem 1rem", borderRadius: "4px" }}>
          📚 Browse All Posts
        </Link>
        <Link href="/posts" style={{ textDecoration: "none", background: "#28a745", color: "white", padding: "0.5rem 1rem", borderRadius: "4px" }}>
          📈 Latest Updates
        </Link>
      </nav>

      <section>
        <h2>🔥 Latest Posts</h2>
        {posts && posts.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {posts.slice(0, 5).map(post => (
              <li key={post.slug} style={{ margin: "1rem 0", padding: "1rem", border: "1px solid #eee", borderRadius: "4px" }}>
                <Link href={`/posts/${post.slug}`} style={{ textDecoration: "none", color: "#333" }}>
                  <h3 style={{ margin: "0 0 0.5rem 0", color: "#007acc" }}>{post.title}</h3>
                  {post.date && <small style={{ color: "#666" }}>📅 {post.date}</small>}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>No posts available yet. Check back soon!</p>
        )}
      </section>

      <section style={{ marginTop: "3rem", padding: "2rem", background: "#f8f9fa", borderRadius: "8px" }}>
        <h2>🎯 Why Choose MedPrepHub?</h2>
        <ul>
          <li>✅ <strong>AI-Curated Content:</strong> Smart content selection for maximum efficiency</li>
          <li>✅ <strong>Daily Updates:</strong> Fresh MCQs and exam insights every day</li>
          <li>✅ <strong>Multi-Exam Prep:</strong> NEET PG, INI-CET, and FMGE coverage</li>
          <li>✅ <strong>High-Yield Focus:</strong> Target the topics that matter most</li>
        </ul>
      </section>
    </main>
  );
}

export async function getStaticProps() {
  try {
    const posts = getAllPosts();
    return { 
      props: { posts: posts || [] },
      revalidate: 3600 // Revalidate every hour
    };
  } catch (error) {
    console.error("Error fetching posts:", error);
    return { 
      props: { posts: [] }
    };
  }
}
