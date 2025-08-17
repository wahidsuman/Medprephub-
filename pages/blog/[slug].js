// pages/blog/[slug].js
import { getAllPostSlugs, getPostBySlug } from "../../lib/posts";
import { marked } from "marked";

export async function getStaticPaths() {
  const slugs = getAllPostSlugs();
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: "blocking", // so new slugs work after deployment
  };
}

export async function getStaticProps({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) return { notFound: true };

  return {
    props: {
      ...post,
      html: marked.parse(post.content || ""),
    },
    revalidate: 60, // ISR
  };
}

export default function PostPage({ title, date, html }) {
  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
      <h1>{title}</h1>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 24 }}>{date}</div>
      <article dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
