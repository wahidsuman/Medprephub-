// lib/posts.js
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const postsDir = path.join(process.cwd(), "content", "posts");

export function getAllPostsMeta() {
  if (!fs.existsSync(postsDir)) return [];
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith(".md"));
  const items = files.map(filename => {
    const filePath = path.join(postsDir, filename);
    const file = fs.readFileSync(filePath, "utf8");
    const { data } = matter(file);

    const slug =
      (data.slug &&
        String(data.slug)
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-")) ||
      filename.replace(/\.md$/, "");

    return {
      slug,
      title: data.title || slug,
      date: data.date ? String(data.date) : null,
    };
  });

  // newest first if a date exists
  items.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return items;
}

export async function getPostBySlug(slug) {
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith(".md"));

  // Try exact filename.md first
  let filePath = path.join(postsDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    // fall back: search by frontmatter slug
    for (const f of files) {
      const full = path.join(postsDir, f);
      const raw = fs.readFileSync(full, "utf8");
      const { data } = matter(raw);
      if (
        data.slug &&
        String(data.slug).trim().toLowerCase().replace(/\s+/g, "-") === slug
      ) {
        filePath = full;
        break;
      }
    }
  }

  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const processed = await remark().use(html).process(content);
  const contentHtml = processed.toString();

  return {
    slug,
    title: data.title || slug,
    date: data.date ? String(data.date) : null,
    contentHtml,
  };
}
