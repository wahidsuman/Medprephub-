// /pages/api/manager/approve.js
import { writeClient } from "../../../lib/sanity";

/**
 * Minimal approval endpoint.
 * Expects JSON body:
 * {
 *   "title": "Post title",
 *   "slug": "post-slug",
 *   "content": "<p>HTML...</p>",
 *   "tags": ["neet-pg", "pharmacology"],
 *   "category": "news",
 *   "meta_title": "...",
 *   "meta_description": "..."
 * }
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const {
      title,
      slug,
      content,
      tags = [],
      category = "general",
      meta_title = "",
      meta_description = "",
    } = req.body || {};

    if (!title || !slug || !content) {
      return res.status(400).json({ ok: false, error: "Missing title/slug/content" });
    }

    const doc = {
      _type: "post",
      title,
      slug: { _type: "slug", current: slug },
      content, // store HTML as string or switch to PortableText later
      tags,
      category,
      meta_title,
      meta_description,
      publishedAt: new Date().toISOString(),
    };

    // If a post with this slug exists, upsert (create or replace)
    const result = await writeClient.createOrReplace({
      ...doc,
      _id: `post.${slug}`,
    });

    return res.status(200).json({ ok: true, id: result._id, slug });
  } catch (err) {
    console.error("[manager/approve] error:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Server error" });
  }
}
