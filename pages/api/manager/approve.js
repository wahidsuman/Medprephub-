// pages/api/manager/approve.js
import { tgSend } from "../../../lib/telegram";

const OWNER_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Simple stub: remembers only the last proposal (in-memory).
if (!global.latestProposal) global.latestProposal = null;

export default async function handler(req, res) {
  try {
    const action = String(req.query.action || "").toUpperCase(); // "YES" or "NO"

    if (!global.latestProposal) {
      if (OWNER_CHAT_ID) await tgSend(OWNER_CHAT_ID, "No pending proposal found.");
      return res.status(200).json({ ok: false, message: "No proposal" });
    }

    if (action !== "YES") {
      if (OWNER_CHAT_ID) await tgSend(OWNER_CHAT_ID, "❌ Changes discarded.");
      global.latestProposal = null;
      return res.status(200).json({ ok: true, published: false });
    }

    // On YES, we'd publish to Sanity. For now, just confirm success.
    const published = global.latestProposal;
    global.latestProposal = null;

    if (OWNER_CHAT_ID) await tgSend(OWNER_CHAT_ID, "✅ Approved. Drafts prepared (stub).");
    return res.status(200).json({ ok: true, published });
  } catch (e) {
    console.error("approve error:", e);
    if (OWNER_CHAT_ID) await tgSend(OWNER_CHAT_ID, "Error while approving.");
    return res.status(200).json({ ok: false });
  }
                                    }
