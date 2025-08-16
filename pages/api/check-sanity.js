// /pages/api/check-sanity.js
import { client } from "../../lib/sanity";

export default async function handler(req, res) {
  try {
    const projectId = process.env.SANITY_PROJECT_ID;
    const dataset   = process.env.SANITY_DATASET || "production";
    const hasToken  = Boolean(process.env.SANITY_API_TOKEN);

    // trivial query just to confirm connectivity
    await client.fetch("*[0]{_id}");

    res.status(200).json({
      ok: true,
      projectId,
      dataset,
      hasToken,
      envFrom: "Vercel server (api route)",
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
