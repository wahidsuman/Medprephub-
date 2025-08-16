// pages/api/manager/propose.js
import { client } from "../../../lib/sanity";

// --- helpers ---------------------------------------------------------------
async function safeQuery(query, params = {}) {
  try {
    return await client.fetch(query, params);
  } catch (e) {
    console.error("Sanity fetch error:", e);
    return [];
  }
}

async function callOpenAI(prompt) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content:
            "You are an AI website manager for a medical exam prep blog. " +
            "You propose daily content updates, safe, factual, and short. " +
            "Return clear bullet lists and a single yes/no approval question.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  const data = await resp.json();
  if (!resp.ok) {
    console.error("OpenAI error:", data);
    throw new Error(data.error?.message || "OpenAI request failed");
  }
  return data?.choices?.[0]?.message?.content?.trim() || "";
}

async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { ok: false, skipped: true };

  const resp = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML", // allow <b>, <i>, etc.
        disable_web_page_preview: true,
      }),
    }
  );
  const data = await resp.json();
  return { ok: !!data.ok, telegram: data };
}

// --- API route -------------------------------------------------------------
export default async function handler(req, res) {
  try {
    // 1) Guard: require OpenAI key
    if (!process.env.OPENAI_API_KEY) {
      return res
        .status(400)
        .json({ ok: false, error: "OPENAI_API_KEY missing" });
    }

    // 2) Pull a little site context (last few posts) to ground the model
    const posts = await safeQuery(
      `*[_type == "post"] | order(_createdAt desc) [0..4]{
        title, "slug": slug.current, _createdAt
      }`
    );

    const date = new Date().toISOString().slice(0, 10);
    const postLines =
      posts?.length
        ? posts
            .map(
              (p, i) =>
                `${i + 1}. ${p.title} (/${p.slug}) – ${String(p._createdAt).slice(0, 10)}`
            )
            .join("\n")
        : "No posts yet.";

    // 3) Build the prompt for the assistant
    const prompt = `
Today's date: ${date}
Recent posts:
${postLines}

Task: Propose a *single daily update plan* for a NEET-PG / FMGE prep site.
Include:
- 2–3 new post ideas with short titles and one-line summaries
- 1–2 quick updates to existing content (what & why)
- 3 SEO keyword suggestions (lower competition, relevant)
- End with: "Do you approve posting these changes? (YES/NO)"

Keep the whole message concise and actionable.
    `.trim();

    // 4) Ask OpenAI
    const draft = await callOpenAI(prompt);

    // 5) Package as a message
    const message = [
      "📣 <b>Daily Website Update Suggestions</b>",
      `Date: <code>${date}</code>`,
      "",
      draft,
    ].join("\n");

    // 6) Optionally push to Telegram
    const tg = await sendTelegram(message);

    // 7) Also return JSON for browser testing
    return res.status(200).json({
      ok: true,
      sentToTelegram: tg.ok || tg.skipped || false,
      telegram: tg.telegram || null,
      preview: message,
    });
  } catch (err) {
    console.error("propose error:", err);
    return res.status(500).json({ ok: false, error: String(err.message || err) });
  }
    }
