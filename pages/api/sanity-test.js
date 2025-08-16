// pages/api/sanity-test.js
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset:   process.env.SANITY_DATASET || "production",
  apiVersion:"2023-10-01",
  useCdn:    true,
});

export default async function handler(req, res) {
  try {
    const posts = await client.fetch(`*[_type == "post"][0..4]{_id, title}[0...5]`);
    res.status(200).json({ ok: true, count: posts?.length || 0, titles: posts?.map(p=>p.title) || [] });
  } catch (e) {
    res.status(200).json({ ok:false, error: String(e) });
  }
}
