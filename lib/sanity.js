// /lib/sanity.js
import { createClient } from "@sanity/client";

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN; // optional (read-only if omitted)

// Create a real client only if we have a projectId
const realClient = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion: "2024-08-01",
      token,
      useCdn: false, // fresh data for admin
      perspective: "published",
    })
  : null;

// Named export expected by pages: `import { client } from "../lib/sanity"`
export const client = realClient;

// Helpful safe fetch to avoid crashes during build
export async function safeFetch(query, params = {}) {
  if (!realClient) return null;
  return realClient.fetch(query, params);
}

// Also export default for any default-import usage
export default realClient;
