import { tgSend } from "../../../lib/telegram";

const OWNER_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// In-memory store (survives only while the function is warm).
if (!global.ownerInbox) global.ownerInbox = [];

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { message, from = "owner" } = req.body || {};
      if (!message || !message.trim()) {
        return res.status(400).json({ ok: false, error: "message required" });
      }
      const item = {
        id: `inbox-${Date.now()}`,
        when: new Date().toISOString(),
        from,
        message: message.trim(),
      };
      global.ownerInbox.push(item);
      // Confirm back to owner on Telegram
      await tgSend(OWNER_CHAT_ID, `📝 Noted: ${item.message}`);
      return res.status(200).json({ ok: true, item });
    }

    if (req.method === "GET") {
      // list items (latest first)
      const list = (global.ownerInbox || []).slice().reverse();
      return res.status(200).json({ ok: true, count: list.length, items: list });
    }

    if (req.method === "DELETE") {
      global.ownerInbox = [];
      await tgSend(OWNER_CHAT_ID, "🧹 Inbox cleared.");
      return res.status(200).json({ ok: true, cleared: true });
    }

    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  } catch (e) {
    console.error(e);
    return res.status(200).json({ ok: false });
  }
  }
