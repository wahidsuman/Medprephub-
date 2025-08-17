// pages/api/debug-paths.js
import * as page from "../posts/[slug]";

export default async function handler(req, res) {
  try {
    const fn = page.getStaticPaths;
    if (!fn) return res.status(200).json({ note: "No getStaticPaths exported" });
    const { paths, fallback } = await fn();
    res.status(200).json({ paths, fallback });
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
}
