export default function handler(req, res) {
  res.status(200).json({
    SANITY_PROJECT_ID: process.env.SANITY_PROJECT_ID || null,
    SANITY_DATASET: process.env.SANITY_DATASET || null,
    SANITY_API_TOKEN: process.env.SANITY_API_TOKEN ? "[set]" : null,
    OPENAI_MODEL: process.env.OPENAI_MODEL || null,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "[set]" : null,
    NODE_ENV: process.env.NODE_ENV || null,
    VERCEL_ENV: process.env.VERCEL_ENV || null
  });
}
