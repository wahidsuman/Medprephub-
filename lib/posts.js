// lib/posts.js
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const postsDirectory = path.join(process.cwd(), "content", "posts");

export function getPostSlugs() {
  return fs.readdirSync(postsDirectory).filter(f => f.endsWith(".md"));
}

export function getAllPosts() {
  const files = getPostSlugs();
  const posts = files.map(file => {
    const fullPath = path.join(postsDirectory, file);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(fileContents);

    // slug from front-matter or filename
    const slug =
      (data.slug && String(data.slug)) ||
      file.replace(/\.md$/i, "");

    return {
      slug,
      title: data.title || slug,
      date: data.date || null,
    };
  });

  // newest first if dates present
  posts.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(b.date) - new Date(a.date);
  });

  return posts;
}

export async function getPostBySlug(slug) {
  const candidates = [
    path.join(postsDirectory, `${slug}.md`)
  ];
  // also allow any file whose front-matter slug matches
  const files = getPostSlugs();
  files.forEach(f => candidates.push(path.join(postsDirectory, f)));

  let fullPath = null;
  let front = null;
  let raw = null;

  // first try exact filename match
  const direct = path.join(postsDirectory, `${slug}.md`);
  if (fs.existsSync(direct)) {
    fullPath = direct;
    raw = fs.readFileSync(fullPath, "utf8");
    front = matter(raw);
  } else {
    // fallback: scan files for matching front-matter slug
    for (const f of files) {
      const p = path.join(postsDirectory, f);
      const content = fs.readFileSync(p, "utf8");
      const fm = matter(content);
      if (String(fm.data.slug || "").trim() === slug) {
        fullPath = p;
        raw = content;
        front = fm;
        break;
      }
    }
  }

  if (!front) return null;

  const processed = await remark().use(html).process(front.content);
  const contentHtml = processed.toString();

  const title = front.data.title || slug;
  const date = front.data.date || null;

  return { slug, title, date, contentHtml };
}
