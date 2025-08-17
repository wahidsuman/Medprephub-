// pages/api/telegram.js
//
// Telegram webhook for your AI Website Manager.
// Commands supported now:
//   /ping                       -> health check
//   /propose <title>            -> drafts a Markdown post and opens a PR
//
// Requires env vars in Vercel:
//   TELEGRAM_BOT_TOKEN  (BotFather token)
//   TELEGRAM_CHAT_ID    (your Telegram user ID; optional but recommended)
//   GITHUB_TOKEN        (PAT classic with repo + workflow)
//   GITHUB_REPO         (e.g. wahidsuman/Medprephub-)
//   GITHUB_BRANCH       (optional; defaults to "main")
//   SITE_CONTENT_DIR    (e.g. content/posts)
//
// Relies on lib/github.js (upsertPost) which handles creating the file/PR.

const { upsertPost } = require("../../lib/github");

// ---------------------- helpers ----------------------

async function sendMessage(chatId, text, opts = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: opts.parse_mode || "Markdown",
    disable_web_page_preview: true,
  };
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function onlyOwner(chatId) {
  const allowed = process.env.TELEGRAM_CHAT_ID
    ? String(chatId) === String(process.env.TELEGRAM_CHAT_ID)
    : true; // if not set, allow anyone (not recommended)
  return allowed;
}

function extractCommand(text) {
  // returns { cmd, arg }
  const t = (text || "").trim();
  if (!t.startsWith("/")) return { cmd: null, arg: null };
  const firstSpace = t.indexOf(" ");
  if (firstSpace === -1) return { cmd: t.toLowerCase(), arg: "" };
  return {
    cmd: t.slice(0, firstSpace).toLowerCase(),
    arg: t.slice(firstSpace + 1).trim(),
  };
}

// Produce a simple Markdown skeleton for the post
function makeMarkdownDraft(title) {
  const safeTitle = title.replace(/"/g, '\\"');
  return `---
title: "${safeTitle}"
date: "${new Date().toISOString()}"
tags: ["draft"]
---

# ${title}

Draft content generated via Telegram. Replace this with real content.
`;
}

// ---------------------- webhook handler ----------------------

export default async function handler(req, res) {
  // Basic GET ping (handy for visiting /api/telegram in a browser)
  if (req.method === "GET") {
    return res
      .status(200)
      .json({ ok: true, message: "Telegram webhook OK (GET)" });
  }

  // Telegram will POST updates here
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const update = req.body || {};
    const message = update.message || update.edited_message;
    if (!message || !message.text) {
      return res.status(200).json({ ok: true, skipped: "no-text" });
    }

    const chatId = message.chat.id;

    // Enforce private admin bot (only you)
    if (!onlyOwner(chatId)) {
      await sendMessage(chatId, "Sorry, this admin bot is private.");
      return res.status(200).json({ ok: true, rejected: "not-owner" });
    }

    const { cmd, arg } = extractCommand(message.text);

    // ----- /ping -----
    if (cmd === "/ping") {
      await sendMessage(chatId, "✅ Bot is working");
      return res.status(200).json({ ok: true });
    }

    // ----- /start or /help -----
    if (cmd === "/start" || cmd === "/help") {
      await sendMessage(
        chatId,
        [
          "*Medprephub Admin*",
          "",
          "Available commands:",
          "• `/ping` – check bot status",
          "• `/propose <title>` – open a PR with a new Markdown post",
          "",
          "_Example:_ `/propose Appendicitis for NEET PG`",
        ].join("\n")
      );
      return res.status(200).json({ ok: true });
    }

    // ----- /propose <title> -----
    if (cmd === "/propose") {
      const title = arg || `New Post ${new Date().toISOString().slice(0, 10)}`;
      await sendMessage(chatId, `📝 Drafting post on *${title}*...`);

      const markdown = makeMarkdownDraft(title);

      try {
        // viaPR: true -> create a branch + PR so you can review/merge
        const result = await upsertPost({
          title,
          markdown,
          viaPR: true,
        });

        if (result.prUrl) {
          await sendMessage(
            chatId,
            `✅ Proposed post: *${title}*\nPR #${result.prNumber}: ${result.prUrl}`
          );
        } else {
          // If viaPR:false was used, you'd land here with direct publish
          const fileUrl = `https://github.com/${process.env.GITHUB_REPO}/blob/${result.branch}/${result.path}`;
          await sendMessage(chatId, `✅ Published directly: ${fileUrl}`);
        }

        return res.status(200).json({ ok: true });
      } catch (err) {
        console.error("propose error:", err);
        await sendMessage(
          chatId,
          `⚠️ Error: ${err?.message || "failed to create PR"}`
        );
        return res.status(200).json({ ok: true, error: "propose-failed" });
      }
    }

    // Fallback: normal chat message (no command)
    await sendMessage(
      chatId,
      "I’m your website manager.\nUse `/propose <title>` to create a post PR."
    );
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("telegram handler error:", e);
    return res.status(200).json({ ok: false, error: String(e) });
  }
    }
