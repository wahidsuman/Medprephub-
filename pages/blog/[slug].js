// pages/blog/[slug].js
import Head from "next/head";
import { getAllPostsMeta, getPostBySlug } from "../../lib/posts";

export async function getStaticPaths() {
  const posts = getAllPostsMeta();
  return {
    paths: posts.map(p => ({ params: { slug: p.slug } })),
    fallback: "blocking",
  };
}

export async function getStaticProps({ params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return { notFound: true };
  return { props: { post }, revalidate: 60 };
}

export default function PostPage({ post }) {
  return (
    <main style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
      <Head><title>{post.title}</title></Head>
      <h1>{post.title}</h1>
      {post.date && <p><small>{post.date}</small></p>}
      <article dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
    </main>
  );
  }
