import OpenAI from "openai";
import slugify from "slugify";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function draftMarkdown({ title, niche = "" }) {
  const topic = title?.trim() || "New post";
  const system = `You are an assistant that writes clean Markdown blog posts.
- Audience: medical students preparing for NEET PG (India).
- Tone: clear, concise, exam-oriented.
- Include headings, bullet points, and a short conclusion.
- Add 3–5 SEO keywords at the end as a list prefixed with "Keywords:".
- Do NOT include any HTML.`;

  const user = `Write a ~600–900 word Markdown post titled: "${topic}".
${niche ? `Focus area: ${niche}` : ""}`;

  const resp = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const md = resp.choices?.[0]?.message?.content?.trim() || `# ${topic}\n\n(TODO)`;

  // filename like: 2025-08-17-title-slug.md
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const slug = slugify(topic, { lower: true, strict: true }) || "post";
  const filename = `${date}-${slug}.md`;

  return { filename, markdown: `---\ntitle: "${topic}"\ndate: "${date}"\n---\n\n${md}\n` };
}
