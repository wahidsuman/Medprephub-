import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export async function getStaticPaths() {
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith(".md"));
  const paths = files.map((file) => ({
    params: { slug: file.replace(/\.md$/, "") },
  }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const fullPath = path.join(POSTS_DIR, `${params.slug}.md`);
  const file = fs.readFileSync(fullPath, "utf-8");
  const { data: frontmatter, content } = matter(file);
  const html = marked.parse(content || "");
  return { props: { frontmatter: frontmatter || {}, html, slug: params.slug } };
}

export default function PostPage({ frontmatter, html }) {
  return (
    <main style={{maxWidth: 800, margin: "40px auto", padding: "0 16px"}}>
      <h1 style={{marginBottom: 8}}>{frontmatter.title || "Untitled"}</h1>
      {frontmatter.date && (
        <p style={{color:"#666", marginTop:0}}>
          {new Date(frontmatter.date).toLocaleDateString()}
        </p>
      )}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
  }
