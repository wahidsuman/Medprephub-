import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";

const CONTENT_DIR = process.env.SITE_CONTENT_DIR || "content/posts";

function listPosts() {
  const dir = path.join(process.cwd(), CONTENT_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const slug = f.replace(/\.md$/, "");
      const src = fs.readFileSync(path.join(dir, f), "utf8");
      const { data } = matter(src);
      return {
        slug,
        title: data.title || slug.replace(/-/g, " "),
        date: data.date || "",
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export default function BlogIndex({ posts }) {
  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 16px" }}>
      <h1>Posts</h1>
      <ul style={{ listStyle: "none", padding: 0, marginTop: 20 }}>
        {posts.map((p) => (
          <li key={p.slug} style={{ margin: "14px 0" }}>
            <Link href={`/blog/${p.slug}`} style={{ fontSize: 18 }}>
              {p.title}
            </Link>
            {p.date && <div style={{ color: "#888", fontSize: 13 }}>{p.date}</div>}
          </li>
        ))}
        {posts.length === 0 && <li>No posts yet.</li>}
      </ul>
    </main>
  );
}

export async function getServerSideProps() {
  return { props: { posts: listPosts() } };
}
