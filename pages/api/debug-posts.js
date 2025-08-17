// pages/api/debug-posts.js
import { listPosts } from "../../lib/posts"; // same helper your pages use
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const contentDir = path.join(process.cwd(), "content", "posts");
    const files = fs.existsSync(contentDir) ? fs.readdirSync(contentDir) : [];
    const posts = await listPosts(); // whatever your lib returns
    res.status(200).json({
      cwd: process.cwd(),
      contentDir,
      filesInContentPosts: files,
      postsFromLib: posts.map(p => ({ slug: p.slug, title: p.title })),
    });
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
}
