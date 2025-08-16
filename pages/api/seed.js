// pages/api/seed.js
import client from "../../lib/sanity";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  if (!client) {
    return res.status(500).json({
      ok: false,
      error:
        "Sanity client not configured. Set SANITY_PROJECT_ID, SANITY_DATASET, and SANITY_API_TOKEN in Vercel.",
    });
  }

  try {
    const now = new Date();
    const slug = `hello-from-seed-${now.getTime()}`;

    const doc = {
      _type: "post",
      // Let Sanity assign _id automatically (safer than hardcoding)
      title: "Hello from Seed",
      slug: { _type: "slug", current: slug },
      body: [
        {
          _type: "block",
          children: [{ _type: "span", text: "This is a seeded post created via API." }],
        },
      ],
      _createdAt: now.toISOString(),
    };

    const created = await client.create(doc);
    return res.status(200).json({ ok: true, slug: created?.slug?.current, id: created?._id });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
  }
