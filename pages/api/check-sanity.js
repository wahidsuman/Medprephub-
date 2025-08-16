export default async function handler(req, res) {
  // Do NOT print the token. Just show if it exists.
  const hasToken = Boolean(process.env.SANITY_API_TOKEN && process.env.SANITY_API_TOKEN.length > 10);

  res.status(200).json({
    projectId: process.env.SANITY_PROJECT_ID || null,
    dataset: process.env.SANITY_DATASET || null,
    hasToken,
    envFrom: "Vercel server (api route)"
  });
}
