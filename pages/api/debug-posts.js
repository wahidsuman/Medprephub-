// pages/api/debug-posts.js
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const contentDir = path.join(process.cwd(), "content", "posts");
    const exists = fs.existsSync(contentDir);
    const files = exists ? fs.readdirSync(contentDir) : [];
    // Read the first few files’ front-matter quickly (no dependencies)
    const peek = files.slice(0, 5).map((f) => {
      const full = path.join(contentDir, f);
      const txt = fs.readFileSync(full, "utf8");
      const fm = txt.match(/^---\n([\s\S]*?)\n---/);
      const front = fm ? fm[1] : "";
      const slugLine = front.match(/^slug:\s*(.*)$/m)?.[1]?.trim();
      const titleLine = front.match(/^title:\s*(.*)$/m)?.[1]?.trim();
      return { file: f, title: titleLine, slug: slugLine };
    });

    res.status(200).json({
      cwd: process.cwd(),
      contentDir,
      exists,
      filesInContentPosts: files,
      peekFrontMatter: peek,
    });
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
                          }
