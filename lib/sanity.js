// /lib/sanity.js
import { createClient } from "@sanity/client";

const projectId = process.env.SANITY_PROJECT_ID;
const dataset   = process.env.SANITY_DATASET || "production";
const token     = process.env.SANITY_API_TOKEN;

// Read client (no token, CDN on)
export const client = createClient({
  projectId,
  dataset,
  apiVersion: "2023-10-01",
  useCdn: true,
});

// Write client (needs token, CDN off)
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion: "2023-10-01",
  useCdn: false,
  token,
});

// Helper: safe fetch for pages
export async function safeFetch(query, params = {}) {
  try {
    return await client.fetch(query, params);
  } catch (e) {
    console.error("Sanity fetch error:", e?.message || e);
    return [];
  }
}

export default client;
