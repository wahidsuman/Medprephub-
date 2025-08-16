// lib/sanity.js
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "YOUR_PROJECT_ID",   // find in sanity.json or Sanity dashboard
  dataset: "production",          // usually "production"
  apiVersion: "2023-05-03",       // today's date or latest
  useCdn: false,                  // set false for fresh data
  token: process.env.SANITY_API_TOKEN // set this in Vercel env variables
});

export default client;
