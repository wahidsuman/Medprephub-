// pages/api/telegram.js
import { tgSend } from "../../lib/telegram";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://medprephub.vercel.app";
const ADMIN_ID = process.env.TELEGRAM_CHAT_ID; // your own Telegram ID (string)

export default async function handler(req, res) {
  // Health check via GET
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, message: "Telegram webhook OK" });
  }

  try {
    const update = req.body;
    const msg = update?.message || update?.edited_message;
    if (!msg) return res.status(200).send("OK");

    const chatId = String(msg.chat?.id || "");
    const textRaw = (msg.text || "").trim();
    const text = textRaw.toLowerCase();

    // Only allow you (ADMIN_ID) to use manager commands.
    const isOwner = ADMIN_ID && String(chatId) === String(ADMIN_ID);

    // ----- YES / NO approvals -----
    if (isOwner && (textRaw === "YES" || textRaw === "NO")) {
      const url = `${BASE}/api/manager/approve?action=${textRaw}`;
      await fetch(url);
      return res.status(200).send("OK");
    }

    // ----- Conversational commands (owner only) -----
    if (isOwner && text.startsWith("/note ")) {
      const msgToStore = textRaw.slice(6); // keep original casing after the space
      await fetch(`${BASE}/api/manager/inbox`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msgToStore, from: "owner" }),
      });
      return res.status(200).send("OK");
    }

    if (isOwner && text === "/inbox") {
      const r = await fetch(`${BASE}/api/manager/inbox`);
      const { items = [] } = await r.json();
      const lines = items.length
        ? items.map(i => `• ${new Date(i.when).toLocaleString()}: ${i.message}`).join("\n")
        : "Inbox is empty.";
      await tgSend(chatId, `<b>Inbox</b>\n${lines}`);
      return res.status(200).send("OK");
    }

    if (isOwner && text === "/clearinbox") {
      await fetch(`${BASE}/api/manager/inbox`, { method: "DELETE" });
      return res.status(200).send("OK");
    }

    // ----- Basic public commands -----
    if (text === "/start") {
      await tgSend(chatId, "👋 Hi! I am your site manager bot. Try /ping or /whoami.");
      return res.status(200).send("OK");
    }

    if (text === "/ping") {
      await tgSend(chatId, "✅ Bot is working");
      return res.status(200).send("OK");
    }

    if (text === "/whoami") {
      await tgSend(chatId, `Your ID: ${chatId}`);
      return res.status(200).send("OK");
    }

    // Unknown commands
    await tgSend(chatId, "❓ Unknown command. Available: /start /ping /whoami");
    return res.status(200).send("OK");
  } catch (err) {
    console.error("Telegram handler error:", err);
    return res.status(200).send("OK");
  }
}
