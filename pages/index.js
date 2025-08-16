import { client } from "../lib/sanity";

export default function Home({ posts }) {
  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px", fontFamily: "system-ui, Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>Welcome to Medprephub 🎉</h1>
      <p style={{ textAlign: "center" }}>Your AI-powered Medical Prep Hub is live!</p>

      <h2 style={{ marginTop: 32 }}>📚 Blog Posts from Sanity</h2>
      {posts.length === 0 ? (
        <p>No posts yet. (We’ll connect AI to start creating them automatically.)</p>
      ) : (
        <ul>
          {posts.map((post) => (
            <li key={post._id}>{post.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export async function getStaticProps() {
  const query = `*[_type == "post"]{ _id, title } | order(_createdAt desc)[0...20]`;
  const posts = await client.fetch(query).catch(() => []);

  return {
    props: { posts: posts || [] },
    revalidate: 60, // re-generate page at most once per minute
  };
}
