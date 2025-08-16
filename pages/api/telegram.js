// pages/api/telegram.js
import fetch from "node-fetch";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_ID = process.env.TELEGRAM_CHAT_ID;        // your Telegram user id
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendMessage(chatId, text) {
  const url = `${TG_API}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

async function callOpenAI(prompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an AI Website Manager for a Medical Exam Prep site (NEET PG, INI-CET, FMGE). " +
            "When asked to create MCQs, return clean, numbered items with 4 options (A–D), " +
            "the correct answer, and a 1–2 line explanation. Keep language precise and exam-appropriate.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`OpenAI error: ${res.status} ${t}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn’t generate a response.";
}

export default async function handler(req, res) {
  // Telegram webhook requires POST
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, message: "Telegram webhook OK" });
  }

  try {
    const update = req.body;

    const chatId = update?.message?.chat?.id;
    const text = update?.message?.text?.trim() || "";
    const fromId = String(update?.message?.from?.id || "");

    if (!chatId || !text) {
      return res.status(200).json({ ok: true });
    }

    // Security: only allow the owner to use this bot
    if (OWNER_ID && String(chatId) !== String(OWNER_ID)) {
      await sendMessage(chatId, "Access denied.");
      return res.status(200).json({ ok: true });
    }

    // Commands
    if (text === "/ping") {
      await sendMessage(chatId, "✅ Bot is working");
      return res.status(200).json({ ok: true });
    }

    if (text === "/whoami") {
      await sendMessage(chatId, `Your ID: ${fromId}`);
      return res.status(200).json({ ok: true });
    }

    // Anything else → use OpenAI
    try {
      if (!OPENAI_KEY) {
        await sendMessage(chatId, "OpenAI key missing. Set OPENAI_API_KEY in Vercel.");
      } else {
        const reply = await callOpenAI(text);
        await sendMessage(chatId, reply);
      }
    } catch (err) {
      await sendMessage(chatId, `⚠️ ${err.message.slice(0, 300)}`);
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(200).json({ ok: true });
  }
}
