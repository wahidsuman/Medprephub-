import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import { getSanitySlugs, getSanityPostBySlug } from "../../lib/sanity";

function localPathFor(slug) {
  return path.join(process.cwd(), "content/posts", `${slug}.md`);
}

export async function getStaticPaths() {
  const postsDir = path.join(process.cwd(), "content/posts");
  let fileSlugs = [];
  try {
    const filenames = fs.readdirSync(postsDir);
    fileSlugs = filenames
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""));
  } catch {
    fileSlugs = [];
  }

  let sanitySlugs = [];
  try {
    sanitySlugs = await getSanitySlugs();
  } catch {
    sanitySlugs = [];
  }

  const unique = Array.from(new Set([...fileSlugs, ...sanitySlugs]));
  const paths = unique.map((slug) => ({ params: { slug } }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const slug = params.slug;

  // 1) Local .md first
  const mdPath = localPathFor(slug);
  if (fs.existsSync(mdPath)) {
    const file = fs.readFileSync(mdPath, "utf8");
    const { data, content } = matter(file);
    const processed = await remark().use(html).process(content);
    const contentHtml = processed.toString();
    return {
      props: {
        frontmatter: { title: data.title || slug, date: data.date || null },
        contentHtml
      }
    };
  }

  // 2) Fallback to Sanity
  const sanityPost = await getSanityPostBySlug(slug);
  if (!sanityPost) return { notFound: true };

  const processed = await remark().use(html).process(sanityPost.markdown || "");
  const contentHtml = processed.toString();

  return {
    props: {
      frontmatter: { title: sanityPost.title || slug, date: null },
      contentHtml
    }
  };
}

export default function Post({ frontmatter, contentHtml }) {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        {frontmatter.title}
      </h1>
      <article dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </main>
  );
}
