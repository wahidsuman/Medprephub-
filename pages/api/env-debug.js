export default function handler(req, res) {
  const safe = {
    SANITY_PROJECT_ID: process.env.SANITY_PROJECT_ID,
    SANITY_DATASET: process.env.SANITY_DATASET,
    // show if a secret exists without revealing it
    SANITY_API_TOKEN: process.env.SANITY_API_TOKEN ? '[set]' : '[missing]',
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '[set]' : '[missing]',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV
  };
  res.status(200).json(safe);
}
