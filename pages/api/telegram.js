// /pages/api/telegram.js
import { askOpenAI } from "../../lib/openai";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = String(process.env.TELEGRAM_CHAT_ID || "");
const SITE_URL = process.env.SITE_URL || "";

async function tgSend(chatId, text) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

async function tgTyping(chatId) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, message: "Telegram webhook OK" });
  }

  try {
    const update = req.body;
    const msg = update?.message;
    const chatId = msg?.chat?.id ? String(msg.chat.id) : "";
    const textRaw = (msg?.text || "").trim();

    // Only allow the admin chat to interact
    if (!chatId || chatId !== ADMIN_CHAT_ID) {
      // Ignore other users silently
      return res.status(200).send("OK");
    }

    const text = textRaw;

    // Basic commands
    if (/^\/start$/i.test(text)) {
      await tgSend(chatId, "👋 Hi! I’m your AI Website Manager. Use /ping, /whoami, send YES/NO to approve, or just type your request.");
      return res.status(200).send("OK");
    }
    if (/^\/ping$/i.test(text)) {
      await tgSend(chatId, "✅ Bot is working");
      return res.status(200).send("OK");
    }
    if (/^\/whoami$/i.test(text)) {
      await tgSend(chatId, `Your Telegram chat ID: ${chatId}`);
      return res.status(200).send("OK");
    }

    // Approval flow
    if (/^YES$/i.test(text)) {
      if (!SITE_URL) {
        await tgSend(chatId, "⚠️ SITE_URL not set in env. Cannot publish.");
        return res.status(200).send("OK");
      }
      await tgSend(chatId, "🟢 Approval received. Publishing…");
      await fetch(`${SITE_URL}/api/manager/approve?decision=YES`);
      return res.status(200).send("OK");
    }
    if (/^NO$/i.test(text)) {
      await tgSend(chatId, "❌ Approval declined. No changes published.");
      return res.status(200).send("OK");
    }

    // If it’s not a command/approval, treat as AI chat to the manager
    await tgTyping(chatId);

    const system = `
You are an AI Website Administrator for a NEET PG / INI-CET / FMGE prep site.
- Be concise, accurate, SEO-aware.
- NEVER publish changes; only suggest or prepare JSON until owner explicitly says YES.
- If asked to post, reply with what you will post and wait for YES.
`.trim();

    const user = text;

    const reply = await askOpenAI({
      system,
      user,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      max_tokens: 900,
      temperature: 0.3,
    });

    await tgSend(chatId, reply || "I have no response.");
    return res.status(200).send("OK");
  } catch (err) {
    console.error("Telegram handler error:", err);
    try {
      await tgSend(String(process.env.TELEGRAM_CHAT_ID || ""), "⚠️ Error handling your request.");
    } catch {}
    return res.status(200).send("OK");
  }
}
