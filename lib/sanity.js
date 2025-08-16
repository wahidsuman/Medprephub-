// /lib/sanity.js
import { createClient } from "@sanity/client";

const projectId = process.env.SANITY_PROJECT_ID;      // e.g. "f5yuhabw"
const dataset = process.env.SANITY_DATASET || "production";
const apiVersion = process.env.SANITY_API_VERSION || "2025-01-01";
const token = process.env.SANITY_WRITE_TOKEN || undefined;

// Read-only client (for fetching during build and at runtime)
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  perspective: "published",
  useCdn: false, // ensure fresh content for SSR/ISR
});

// Write client (for creating/updating docs)
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token,          // requires SANITY_WRITE_TOKEN in Vercel env
  useCdn: false,
});

// Helper: safe fetch that never throws
export async function safeFetch(query, params = {}) {
  try {
    return await client.fetch(query, params);
  } catch (err) {
    console.error("Sanity fetch error:", err?.message || err);
    return []; // callers can default to []
  }
  }
