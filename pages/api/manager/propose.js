// /pages/api/manager/propose.js
import { askOpenAI } from "../../../lib/openai";

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegram(text) {
  if (!TG_TOKEN || !TG_CHAT_ID) throw new Error("Telegram env vars missing");
  // Telegram messages max ~4096 chars. Send in chunks if needed.
  const chunks = [];
  const max = 3500;
  let remaining = text;
  while (remaining.length > max) {
    const cut = remaining.lastIndexOf("\n", max);
    const idx = cut > 0 ? cut : max;
    chunks.push(remaining.slice(0, idx));
    remaining = remaining.slice(idx);
  }
  chunks.push(remaining);

  for (const part of chunks) {
    const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text: part,
      }),
    });
    const data = await res.json();
    if (!res.ok || data?.ok === false) {
      throw new Error(data?.description || "Failed to send Telegram message");
    }
  }
}

export default async function handler(req, res) {
  // Allow GET to trigger manually from browser and POST if you later call it from cron
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);

    // Minimal site context for now (we’ll enrich in next steps)
    const siteContext = `
      Site: Medprephub (NEET PG / FMGE / INI-CET exam prep)
      Existing sections: blog list, seed content available.
      Constraints: NEVER publish without explicit YES approval. Keep medical accuracy and SEO in mind.
    `;

    const system = `
You are an AI Website Administrator for a Medical Exam Prep site (NEET PG, FMGE, INI-CET).
Always propose updates but DO NOT publish without explicit YES approval.
Write clearly for busy medical students. Keep items factual and concise.
Output MUST follow the EXACT "Daily Website Update Suggestions" template.
    `.trim();

    const user = `
Today: ${today}

Context:
${siteContext}

Tasks to propose:
- 1–2 new content pieces (titles + one-line summary)
- 2 updates to existing/typical posts (what to improve)
- 3–5 SEO suggestions (long-tail keywords/internal links)
- Keep total message under 1200 words.

Template to fill:

📢 **Daily Website Update Suggestions**
Date: ${today}

**New Content Ready:**
1. {{Title}} – {{Short Summary}}
2. {{Title}} – {{Short Summary}}

**Updates to Existing Posts:**
1. {{Page URL or topic}} – {{Improvement Suggestion}}
2. {{Page URL or topic}} – {{Improvement Suggestion}}

**SEO Suggestions:**
- {{Keyword 1}}, {{Keyword 2}}, {{Keyword 3}}

Do you approve posting these changes? (YES/NO)
    `.trim();

    const plan = await askOpenAI({ system, user, max_tokens: 1000, temperature: 0.3 });

    // Send to Telegram for approval
    await sendTelegram(plan);

    return res.status(200).json({ ok: true, sent: true, preview: plan });
  } catch (err) {
    console.error("propose error:", err);
    return res.status(200).json({ ok: false, error: String(err.message || err) });
  }
}
