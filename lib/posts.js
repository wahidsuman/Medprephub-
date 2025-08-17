// lib/posts.js
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import slugify from "slugify";

const CONTENT_DIR =
  process.env.SITE_CONTENT_DIR?.trim() || "content/posts";

function postsPath() {
  return path.join(process.cwd(), CONTENT_DIR);
}

export function getAllPostSlugs() {
  const dir = postsPath();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx?$/, ""));
}

export function getPostBySlug(slug) {
  const filePathMd = path.join(postsPath(), `${slug}.md`);
  const filePathMdx = path.join(postsPath(), `${slug}.mdx`);
  const fullPath = fs.existsSync(filePathMd) ? filePathMd : filePathMdx;

  if (!fullPath || !fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const title = data.title || slugify(slug, { lower: true });
  const date = data.date || new Date().toISOString().slice(0, 10);

  return {
    slug: data.slug || slug,
    title,
    date,
    content,
  };
}

export function getAllPosts() {
  return getAllPostSlugs()
    .map((slug) => getPostBySlug(slug))
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
