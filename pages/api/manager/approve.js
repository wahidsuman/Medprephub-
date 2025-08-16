// /pages/api/manager/approve.js
import { askOpenAI } from "../../../lib/openai";
import { writeClient } from "../../../lib/sanity";

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegram(text) {
  if (!TG_TOKEN || !TG_CHAT_ID) throw new Error("Telegram env vars missing");
  const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TG_CHAT_ID, text }),
  });
  const data = await res.json();
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.description || "Failed to send Telegram message");
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    // Accept decision from query (?decision=YES) or JSON body { decision: "YES" }
    const decision =
      (req.query.decision || (req.body && req.body.decision) || "").trim().toUpperCase();

    if (decision !== "YES") {
      await sendTelegram("❌ Approval not granted (expected YES). No changes were published.");
      return res.status(200).json({ ok: true, published: false, reason: "Not approved" });
    }

    // Generate one *example* article payload to publish (we’ll expand later)
    const system = `
You are an AI Website Administrator. Produce one JSON object for a new medical exam prep blog post.
It must be accurate, concise, and original. Never include markdown—HTML only in "content".
Output ONLY valid JSON with keys:
{ "title", "slug", "category", "tags", "content", "meta_title", "meta_description" }
`.trim();

    const user = `
Site: NEET PG / FMGE / INI-CET prep
Goal: Create a helpful, factual short article fit for busy medical students.
Length: ~600–900 words.
Include brief intro, 3–5 subheadings, bullet points where useful.
Topic suggestion: "Autonomic Pharmacology: High-Yield Summary for FMGE"
`.trim();

    const jsonText = await askOpenAI({
      system,
      user,
      max_tokens: 1200,
      temperature: 0.4,
      response_format: { type: "json_object" }, // if your askOpenAI supports it
    });

    // Parse AI output
    let payload;
    try {
      payload = JSON.parse(jsonText);
    } catch (_e) {
      // Fallback: wrap as a minimal doc if parsing fails
      payload = {
        title: "AI Draft: Autonomic Pharmacology (High-Yield)",
        slug: "ai-draft-autonomic-pharmacology",
        category: "Pharmacology",
        tags: ["autonomic", "pharmacology", "fmge", "neet-pg"],
        content: `<p>Draft could not be parsed; placeholder created.</p>`,
        meta_title: "Autonomic Pharmacology — High-Yield Summary",
        meta_description:
          "Concise high-yield summary of autonomic pharmacology for FMGE/NEET PG preparation.",
      };
    }

    // Build Sanity document
    const doc = {
      _type: "post",
      title: payload.title,
      slug: { current: payload.slug },
      category: payload.category || "General",
      tags: payload.tags || [],
      content: payload.content || "<p></p>",
      metaTitle: payload.meta_title || payload.title,
      metaDescription: payload.meta_description || "",
      publishedAt: new Date().toISOString(),
      source: "ai-manager",
    };

    // Create in Sanity (requires SANITY token in your env)
    const created = await writeClient.create(doc);

    // Notify Telegram
    await sendTelegram(
      `✅ Published:\n${doc.title}\n\nSlug: ${doc.slug.current}\nDoc ID: ${created?._id}`
    );

    return res.status(200).json({ ok: true, published: true, id: created?._id });
  } catch (err) {
    console.error("approve error:", err);
    try {
      await sendTelegram(`⚠️ Publish failed: ${String(err.message || err)}`);
    } catch {}
    return res.status(200).json({ ok: false, error: String(err.message || err) });
  }
      }
