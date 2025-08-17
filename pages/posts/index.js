import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export async function getStaticProps() {
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith(".md"));
  const posts = files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const { data } = matter(fs.readFileSync(path.join(POSTS_DIR, file), "utf-8"));
    return {
      slug,
      title: data.title || slug,
      date: data.date || null,
    };
  }).sort((a, b) => (new Date(b.date || 0)) - (new Date(a.date || 0)));

  return { props: { posts } };
}

export default function PostsIndex({ posts }) {
  return (
    <main style={{maxWidth: 800, margin: "40px auto", padding: "0 16px"}}>
      <h1>All Posts</h1>
      <ul style={{listStyle:"none", padding:0}}>
        {posts.map(p => (
          <li key={p.slug} style={{margin:"12px 0"}}>
            <Link href={`/posts/${p.slug}`} style={{textDecoration:"none"}}>
              {p.title}
            </Link>
            {p.date && <span style={{color:"#666"}}> — {new Date(p.date).toLocaleDateString()}</span>}
          </li>
        ))}
      </ul>
    </main>
  );
                 }
