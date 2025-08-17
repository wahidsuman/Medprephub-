// pages/posts/[slug].js
import { getAllPosts, getPostBySlug } from "../../lib/posts";

export async function getStaticPaths() {
  const posts = getAllPosts();
  return {
    paths: posts.map(p => ({ params: { slug: p.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const post = await getPostBySlug(params.slug);
  return { props: { post } };
}

export default function PostPage({ post }) {
  return (
    <main style={{maxWidth: 720, margin: "2rem auto", padding: "0 1rem"}}>
      <h1>{post.title}</h1>
      {post.date ? <div style={{opacity:.7}}>{post.date}</div> : null}
      <article dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
    </main>
  );
        }
