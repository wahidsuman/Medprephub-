// /pages/blog/[slug].js
import Head from "next/head";
import Link from "next/link";
import { safeFetch } from "../../lib/sanity";

const POST_BY_SLUG = /* groq */ `
*[_type == "post" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  content,
  tags,
  category,
  meta_title,
  meta_description
}
`;

const ALL_SLUGS = /* groq */ `
*[_type == "post" && defined(slug.current)][0...200]{
  "slug": slug.current
}
`;

export default function PostPage({ post }) {
  if (!post) return null;

  const date = post.publishedAt
    ? new Date(post.publishedAt).toISOString().slice(0, 10)
    : "";

  return (
    <main style={{ maxWidth: 860, margin: "2rem auto", padding: "0 1rem", lineHeight: 1.7 }}>
      <Head>
        <title>{post.meta_title || post.title}</title>
        <meta
          name="description"
          content={post.meta_description || post.title}
        />
      </Head>

      <p style={{ marginBottom: "1rem" }}>
        <Link href="/blog">← All posts</Link>
      </p>

      <h1 style={{ fontSize: "2.25rem", fontWeight: 800, marginBottom: ".25rem" }}>{post.title}</h1>
      <div style={{ color: "#666", marginBottom: "1.25rem" }}>{date}</div>

      {/* We currently store HTML in `content`. Later we can switch to PortableText. */}
      <article
        dangerouslySetInnerHTML={{ __html: post.content || "" }}
        style={{ fontSize: "1.05rem" }}
      />

      {Array.isArray(post.tags) && post.tags.length > 0 && (
        <div style={{ marginTop: "2rem", color: "#666" }}>
          <strong>Tags:</strong> {post.tags.join(", ")}
        </div>
      )}
    </main>
  );
}

export async function getStaticPaths() {
  const slugs = (await safeFetch(ALL_SLUGS)) || [];
  const paths = slugs
    .filter((s) => s?.slug)
    .map((s) => ({ params: { slug: s.slug } }));
  return { paths, fallback: "blocking" }; // new posts will be generated on first hit
}

export async function getStaticProps({ params }) {
  const post = await safeFetch(POST_BY_SLUG, { slug: params.slug });
  if (!post || !post._id) {
    return { notFound: true, revalidate: 30 };
  }
  return {
    props: { post },
    revalidate: 60, // ISR
  };
}
