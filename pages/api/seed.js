// /pages/api/seed.js
import { writeClient } from "../../lib/sanity";

export default async function handler(req, res) {
  try {
    // Guard: environment must be present
    if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_DATASET || !process.env.SANITY_API_TOKEN) {
      return res.status(500).json({
        ok: false,
        error: "Sanity client not configured. Set SANITY_PROJECT_ID, SANITY_DATASET, and SANITY_API_TOKEN in Vercel.",
      });
    }

    // Create a simple "post" document (requires `post` schema in your Sanity project)
    const now  = Date.now();
    const slug = `hello-from-seed-${now}`;

    const doc = {
      _type: "post",
      title: "Hello from Seed",
      slug: { _type: "slug", current: slug },
      publishedAt: new Date().toISOString(),
      body: [
        {
          _type: "block",
          children: [
            { _type: "span", text: "This post was created via the /api/seed route." },
          ],
        },
      ],
      // Optional tags/fields if your schema supports them:
      // tags: ["announcement", "seed"],
      // category: "General",
    };

    const result = await writeClient.create(doc);
    return res.status(200).json({ ok: true, id: result._id, slug });
  } catch (err) {
    console.error("Seed error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
