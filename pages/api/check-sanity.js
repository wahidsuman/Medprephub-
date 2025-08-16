// pages/api/check-sanity.js
export default async function handler(req, res) {
  try {
    const projectId = process.env.SANITY_PROJECT_ID || null;
    const dataset   = process.env.SANITY_DATASET || null;
    const hasToken  = !!process.env.SANITY_API_TOKEN;

    res.status(200).json({
      ok: true,
      projectId,
      dataset,
      hasToken,
      envFrom: "Vercel server (api route)",
    });
  } catch (e) {
    res.status(200).json({ ok:false, error: String(e) });
  }
}
