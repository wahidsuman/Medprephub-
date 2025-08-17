// lib/posts.js
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const postsDir = path.join(process.cwd(), "content", "posts");

export function getPostSlugs() {
  if (!fs.existsSync(postsDir)) return [];
  return fs.readdirSync(postsDir).filter(f => f.endsWith(".md"));
}

export function getAllPosts() {
  const slugs = getPostSlugs();
  const posts = slugs.map((file) => {
    const fullPath = path.join(postsDir, file);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(fileContents);
    const slug = file.replace(/\.md$/, "");
    return {
      slug,
      title: data.title ?? slug,
      date: data.date ?? null,
    };
  });
  // newest first if dates exist
  return posts.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export async function getPostBySlug(slug) {
  const mdPath = path.join(postsDir, `${slug}.md`);
  if (!fs.existsSync(mdPath)) return null;

  const raw = fs.readFileSync(mdPath, "utf8");
  const { data, content } = matter(raw);
  const processed = await remark().use(html).process(content);
  const contentHtml = processed.toString();

  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? null,
    contentHtml,
  };
                               }
