// lib/sanity.js
import { createClient } from "@sanity/client";

export const sanity = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: "production",
  apiVersion: "2025-08-16",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN, // must be an Editor/Write token
});
