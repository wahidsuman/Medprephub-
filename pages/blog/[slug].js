import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = process.env.SITE_CONTENT_DIR || "content/posts";

function readPost(slug) {
  const file = path.join(process.cwd(), CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const source = fs.readFileSync(file, "utf8");
  const { data, content } = matter(source);
  return {
    title: data.title || slug.replace(/-/g, " "),
    date: data.date || null,
    content,
  };
}

export default function PostPage({ post }) {
  if (!post) return <main style={{maxWidth:760,margin:"40px auto",padding:"0 16px"}}>Not found</main>;
  return (
    <main style={{ maxWidth: 760, margin: "40px auto", padding: "0 16px" }}>
      <h1>{post.title}</h1>
      {post.date && <p style={{ color: "#888" }}>{post.date}</p>}
      <article style={{ lineHeight: 1.7, marginTop: 20, whiteSpace: "pre-wrap" }}>
        {post.content}
      </article>
    </main>
  );
}

// server-side so we don't need a rebuild for new posts
export async function getServerSideProps({ params }) {
  const slug = params?.slug || "";
  const post = readPost(slug);
  return { props: { post } };
    }
