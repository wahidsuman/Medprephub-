// pages/api/telegram.js
// Commands:
//   /ping
//   /propose <title>
//   /approve <pr-number>

import { createPostPR, mergePR } from "../../lib/github.js";
import { draftMarkdown } from "../../lib/content.js";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; // your personal chat id
const SITE_CONTENT_DIR = process.env.SITE_CONTENT_DIR || "content/posts";

async function sendMessage(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const update = req.body;
    const msg = update?.message;
    const chatId = msg?.chat?.id?.toString();
    const text = (msg?.text || "").trim();

    // Only respond to YOUR chat
    if (!chatId || (TELEGRAM_CHAT_ID && chatId !== TELEGRAM_CHAT_ID.toString())) {
      return res.status(200).json({ ok: true });
    }

    if (text === "/ping") {
      await sendMessage("✅ Bot is online.");
      return res.status(200).json({ ok: true });
    }

    if (text.startsWith("/propose")) {
      // Expect: /propose Title of post
      const title = text.replace("/propose", "").trim() || "Untitled Post";
      await sendMessage(`✍️ Drafting: “${title}”…`);

      const niche = process.env.TOPIC_NICHE || "";
      const { filename, markdown } = await draftMarkdown({ title, niche });

      const pr = await createPostPR({
        filepath: `${SITE_CONTENT_DIR}/${filename}`,
        content: markdown,
        title: `Proposed: ${title}`,
        body: `Auto-proposed via Telegram.\nNiche: ${niche || "(not set)"}`,
      });

      await sendMessage(
        `📄 Proposed post:\n• File: ${filename}\n• PR: #${pr.number} – ${pr.html_url}\n\nReply with /approve ${pr.number} to merge.`
      );
      return res.status(200).json({ ok: true });
    }

    if (text.startsWith("/approve")) {
      const num = parseInt(text.replace("/approve", "").trim(), 10);
      if (Number.isNaN(num)) {
        await sendMessage("❗ Usage: /approve <pr-number>");
        return res.status(200).json({ ok: true });
      }
      await sendMessage(`🔧 Merging PR #${num}…`);
      const merged = await mergePR(num);
      await sendMessage(
        merged.merged
          ? `✅ Merged PR #${num}.`
          : `⚠️ Could not merge PR #${num}: ${merged.message || "unknown reason"}`
      );
      return res.status(200).json({ ok: true });
    }

    await sendMessage("Commands:\n• /ping\n• /propose <title>\n• /approve <pr-number>");
    return res.status(200).json({ ok: true });
  } catch (e) {
    await sendMessage(`⚠️ Error: ${e.message}`);
    return res.status(200).json({ ok: true });
  }
}
