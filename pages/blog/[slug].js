// pages/blog/[slug].js
import Head from "next/head";
import { getAllPosts, getPostBySlug } from "../../lib/posts";

export async function getStaticPaths() {
  const posts = getAllPosts();
  const paths = posts.map(p => ({ params: { slug: p.slug } }));
  return { paths, fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return { notFound: true };
  return { props: { post }, revalidate: 60 };
}

export default function PostPage({ post }) {
  return (
    <main style={{maxWidth: 720, margin: "40px auto", padding: "0 16px"}}>
      <Head><title>{post.title}</title></Head>
      <h1>{post.title}</h1>
      {post.date && (
        <div style={{opacity: 0.7, marginBottom: 24}}>
          {new Date(post.date).toLocaleDateString()}
        </div>
      )}
      <article dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
    </main>
  );
}
