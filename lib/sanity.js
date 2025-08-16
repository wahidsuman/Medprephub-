// /lib/sanity.js
import { createClient } from "@sanity/client";

const projectId = process.env.SANITY_PROJECT_ID; // e.g. "f5yuhabw"
const dataset   = process.env.SANITY_DATASET || "production";
const apiToken  = process.env.SANITY_API_TOKEN;  // only needed for writes

if (!projectId || !dataset) {
  console.warn("[sanity] Missing SANITY_PROJECT_ID or SANITY_DATASET env vars");
}

// Read-only client (no token)
export const client = createClient({
  projectId,
  dataset,
  useCdn: true,
  apiVersion: "2024-08-01",
});

// Write client (needs token)
export const writeClient = createClient({
  projectId,
  dataset,
  token: apiToken,
  useCdn: false,
  apiVersion: "2024-08-01",
});

/**
 * Safe fetch wrapper that never throws for common GROQ fetches.
 * Returns [] for array queries, {} for object queries on failure.
 */
export async function safeFetch(query, params = {}) {
  try {
    const data = await client.fetch(query, params);
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") return data;
    return [];
  } catch (err) {
    console.error("[sanity.safeFetch] Error:", err?.message || err);
    // naive shape guessing: arrays start with '*[...]' or have '[]'
    const q = String(query || "");
    const looksArray = q.includes("[") || q.includes("[]") || q.trim().startsWith("*");
    return looksArray ? [] : {};
  }
}
