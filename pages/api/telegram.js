// pages/api/telegram.js
/**
 * Telegram ↔ OpenAI webhook for your AI Website Manager
 * - /ping => quick health check
 * - /whoami => returns your Telegram user id
 * - otherwise: sends the message to OpenAI and replies with the answer
 *
 * Env needed on Vercel:
 *  TELEGRAM_BOT_TOKEN
 *  TELEGRAM_CHAT_ID            (your chat id, e.g. 1044834121)
 *  TELEGRAM_ALLOWED_USER_ID    (same as above to restrict access)
 *  OPENAI_API_KEY
 *  OPENAI_MODEL                (e.g. gpt-4o-mini)
 */

export const config = {
  api: {
    bodyParser: true, // Telegram sends JSON
  },
};

const TG_API = (token) => `https://api.telegram.org/bot${token}`;

function requiredEnv() {
  const miss = [];
  if (!process.env.TELEGRAM_BOT_TOKEN) miss.push("TELEGRAM_BOT_TOKEN");
  if (!process.env.TELEGRAM_CHAT_ID) miss.push("TELEGRAM_CHAT_ID");
  if (!process.env.OPENAI_API_KEY) miss.push("OPENAI_API_KEY");
  if (!process.env.OPENAI_MODEL) miss.push("OPENAI_MODEL");
  return miss;
}

async function sendTG(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  // Telegram max message length is 4096. Split if longer.
  const chunks = [];
  const max = 4000;
  for (let i = 0; i < text.length; i += max) {
    chunks.push(text.slice(i, i + max));
  }
  for (const part of chunks) {
    await fetch(`${TG_API(token)}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: part,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
  }
}

async function askOpenAI(userText) {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const sys = `
You are the AI Website Manager for a Medical Exam Prep site (NEET PG, FMGE, INI-CET).
Always be accurate, concise, and structured. Prefer bullet lists and numbered steps.
When asked to generate MCQs, write: Question, (A)-(D), Correct Answer, 2–3 line Explanation.
Never publish; you're only drafting suggestions.`;

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 900,
      messages: [
        { role: "system", content: sys.trim() },
        { role: "user", content: userText },
      ],
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => String(resp.status));
    throw new Error(`OpenAI error: ${resp.status} ${errText}`);
  }

  const data = await resp.json();
  const text =
    data.choices?.[0]?.message?.content?.trim() ||
    "Sorry, I didn't get a response.";
  return text;
}

export default async function handler(req, res) {
  // Simple GET for health check in browser
  if (req.method === "GET") {
    const miss = requiredEnv();
    if (miss.length) {
      return res
        .status(500)
        .json({ ok: false, message: "Missing env", missing: miss });
    }
    return res.status(200).json({ ok: true, message: "Telegram webhook OK" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const miss = requiredEnv();
    if (miss.length) throw new Error(`Missing env: ${miss.join(", ")}`);

    const update = req.body || {};
    const msg = update.message || update.edited_message;
    if (!msg) {
      return res.status(200).json({ ok: true, skipped: "no message" });
    }

    const chatId = msg.chat?.id;
    const fromId = msg.from?.id;
    const text = (msg.text || "").trim();

    // Restrict access to your Telegram ID
    const allowed = String(process.env.TELEGRAM_ALLOWED_USER_ID || "").trim();
    if (allowed && String(fromId) !== allowed) {
      // Silently ignore others
      return res.status(200).json({ ok: true, skipped: "unauthorized user" });
    }

    // Commands
    if (text === "/ping") {
      await sendTG(chatId, "✅ Bot is working");
      return res.status(200).json({ ok: true });
    }
    if (text === "/whoami") {
      await sendTG(chatId, `Your ID: ${fromId}`);
      return res.status(200).json({ ok: true });
    }

    // Typing action (optional)
    await fetch(`${TG_API(process.env.TELEGRAM_BOT_TOKEN)}/sendChatAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action: "typing" }),
    });

    // Ask OpenAI
    const answer = await askOpenAI(text);
    await sendTG(chatId, answer);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("telegram handler error:", err);
    try {
      const chatId =
        req.body?.message?.chat?.id || process.env.TELEGRAM_CHAT_ID;
      if (chatId) {
        await sendTG(
          chatId,
          `⚠️ Error: ${err.message?.slice(0, 300) || String(err)}`
        );
      }
    } catch (_) {}
    return res.status(200).json({ ok: false, error: String(err.message || err) });
  }
  }
