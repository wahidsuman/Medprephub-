// pages/api/manager/inbox.js
import { tgSend } from "../../../lib/telegram";

// ⚠️ Ephemeral (in-memory) storage. Survives only while function stays warm.
// We'll swap this to Sanity later for persistence.
if (!global.ownerInbox) global.ownerInbox = [];

const OWNER_CHAT_ID = process.env.TELEGRAM_CHAT_ID; // your numeric ID

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
      if (OWNER_CHAT_ID) {
        await tgSend(OWNER_CHAT_ID, `📝 Noted: ${item.message}`);
      }
      return res.status(200).json({ ok: true, item });
    }

    if (req.method === "GET") {
      const list = (global.ownerInbox || []).slice().reverse();
      return res.status(200).json({ ok: true, count: list.length, items: list });
    }

    if (req.method === "DELETE") {
      global.ownerInbox = [];
      if (OWNER_CHAT_ID) await tgSend(OWNER_CHAT_ID, "🧹 Inbox cleared.");
      return res.status(200).json({ ok: true, cleared: true });
    }

    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  } catch (e) {
    console.error("inbox error:", e);
    return res.status(200).json({ ok: false });
  }
  }
