import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

export async function getStaticProps({ params }) {
  const slug = params.slug;
  const fullPath = path.join(process.cwd(), "content/posts", `${slug}.md`);
  const file = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(file);

  const processed = await remark().use(html).process(content);
  const contentHtml = processed.toString();

  return { props: { frontmatter: data, contentHtml } };
}

export default function Post({ frontmatter, contentHtml }) {
  return (
    <main>
      <h1>{frontmatter.title}</h1>
      <article dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </main>
  );
}
