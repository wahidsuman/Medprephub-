/**
 * Simple content generator:
 * - Calls OpenAI to create 1..N posts (default N=1)
 * - Writes Markdown files into content/posts/
 * - Front matter: title, slug, date, tags, excerpt
 *
 * Requirements (set in GitHub repo -> Settings -> Secrets and variables):
 *   Secrets:
 *     - OPENAI_API_KEY
 *   Variables (optional):
 *     - TOPIC_NICHE (e.g., "NEET PG · Cardiology MCQs")
 *     - POST_COUNT (e.g., "2")
 */

const fs = require('fs');
const path = require('path');

// -------- settings --------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY secret.");
  process.exit(1);
}

const NICHE = process.env.TOPIC_NICHE || "NEET PG · High-yield medical prep";
const COUNT = Math.max(1, parseInt(process.env.POST_COUNT || "1", 10));
const OUT_DIR = path.join(process.cwd(), "content", "posts");
fs.mkdirSync(OUT_DIR, { recursive: true });

// Pick a solid, cheap, available model name:
const MODEL = "gpt-4o-mini"; // <-- change if you prefer another
// --------------------------

async function ai(prompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "You are an expert medical content writer for NEET PG. Write accurate, concise, exam-focused posts." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

function slugify(s) {
  return s.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function extractTitle(markdown) {
  // Use first markdown header or first line as title
  const m = markdown.match(/^#\s+(.+)$/m);
  if (m) return m[1].trim();
  const firstLine = markdown.split("\n").find(l => l.trim());
  return (firstLine || "New Post").replace(/^#+\s*/, "").trim();
}

function excerptFrom(md) {
  // First non-empty line of text (without heading markers)
  const lines = md.split("\n")
    .map(l => l.trim())
    .filter(Boolean);
  const first = lines.find(l => !l.startsWith("#"));
  return (first || "").replace(/\*/g, "").slice(0, 180);
}

async function generateOne() {
  const prompt = `
Create a single high-quality blog post for "${NICHE}" formatted in Markdown.

Guidelines:
- Start with a clear H1 title.
- 600–900 words.
- Include short sections with H2/H3, bullets, and **bold** key points.
- (If MCQs) include 5 exam-style MCQs with answers & 1–2 line explanations.
- Be original, accurate, and exam-oriented.
`;
  const md = await ai(prompt);
  const title = extractTitle(md);
  const slug = slugify(title);
  const date = new Date().toISOString();

  const frontmatter = [
    "---",
    `title: "${title.replace(/"/g, '\\"')}"`,
    `slug: "${slug}"`,
    `date: "${date}"`,
    `tags: ["NEET PG","${NICHE.replace(/"/g, '\\"')}"]`,
    `excerpt: "${excerptFrom(md).replace(/"/g, '\\"')}"`,
    "---",
    "",
  ].join("\n");

  const filePath = path.join(OUT_DIR, `${slug}.md`);
  fs.writeFileSync(filePath, frontmatter + md, "utf8");
  console.log(`✔ Wrote ${filePath}`);
}

(async () => {
  try {
    for (let i = 0; i < COUNT; i++) {
      await generateOne();
    }
    console.log("All posts generated.");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
