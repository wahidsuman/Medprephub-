import { createClient } from "@sanity/client";

export const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  apiVersion: "2023-01-01", // keep this fixed date
  useCdn: true, // `false` if you need fresh data
  token: process.env.SANITY_API_TOKEN, // only needed for write or private data
});
