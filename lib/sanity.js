// lib/sanity.js
import sanityClient from "@sanity/client";

export const client = sanityClient({
  projectId: process.env.SANITY_PROJECT_ID,              // e.g. "f5yuhabw"
  dataset: process.env.SANITY_DATASET || "production",   // "production" is common
  apiVersion: "2023-10-01",
  useCdn: true,                                          // faster, OK for public content
  token: process.env.SANITY_API_READ_TOKEN || undefined, // optional for read
});

export async function safeFetch(query, params = {}) {
  try {
    if (!client) return [];
    return await client.fetch(query, params);
  } catch (err) {
    console.error("Sanity fetch failed:", err?.message || err);
    return [];
  }
}
