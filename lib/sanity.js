import { createClient } from '@sanity/client';

export const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: process.env.SANITY_API_VERSION || '2024-06-01',
  useCdn: true,
  token: process.env.SANITY_READ_TOKEN || undefined
});

export async function getSanitySlugs() {
  const query = `*[_type == "post" && defined(slug.current)][].slug.current`;
  return await sanityClient.fetch(query);
}

export async function getSanityPostBySlug(slug) {
  const query = `
    *[_type == "post" && slug.current == $slug][0]{
      title,
      "markdown": coalesce(markdown, body, content, description, "")
    }
  `;
  const doc = await sanityClient.fetch(query, { slug });
  if (!doc) return null;
  return { title: doc.title || slug, markdown: doc.markdown || "" };
}
