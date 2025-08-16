// pages/api/telegram.js
import { client as sanity } from "../../lib/sanity";

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = (process.env.TELEGRAM_ADMIN_ID || "").trim(); // your numeric chat id

const TG = {
  send: async (chatId, text, extra = {}) => {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...extra,
      }),
    });
  },
};

function isAdmin(chatId) {
  return String(chatId) === ADMIN_ID;
}

function dailyTemplate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  const today = `${y}-${m}-${day}`;

  return [
    "📢 <b>Daily Website Update Suggestions</b>",
    `Date: <b>${today}</b>`,
    "",
    "<b>New Content Ready:</b>",
    "1. {{Title of New Post}} – {{Short Summary}}",
    "2. {{Title of New Post}} – {{Short Summary}}",
    "",
    "<b>Updates to Existing Posts:</b>",
    "1. {{Page URL}} – {{Improvement Suggestion}}",
    "",
    "<b>SEO Suggestions:</b>",
    "- {{Keyword 1}}, {{Keyword 2}}",
    "",
    "Do you approve posting these changes? (YES/NO)",
  ].join("\n");
}

async function handleApproveOrReject(cmd, arg, chatId) {
  if (!arg) {
    await TG.send(
      chatId,
      `Usage:\n<code>/${cmd} &lt;docId or slug&gt;</code>\nExample: <code>/${cmd} post-welcome</code>`
    );
    return;
  }

  if (!process.env.SANITY_API_TOKEN) {
    await TG.send(
      chatId,
      "Sanity write token not set. Add <code>SANITY_API_TOKEN</code> in Vercel and redeploy."
    );
    return;
  }

  // Try patch by id OR by slug
  const publish = cmd === "approve";
  try {
    // try by _id directly
    let docId = arg;

    // If not a known _id, try to resolve by slug
    if (!arg.startsWith("post-") && !arg.startsWith("drafts.")) {
      const query = `*[_type == "post" && slug.current == $slug][0]{_id}`;
      const found = await sanity.fetch(query, { slug: arg });
      if (found && found._id) docId = found._id;
    }

    if (!docId) {
      await TG.send(chatId, "Document not found.");
      return;
    }

    if (publish) {
      // Mark as approved/published (simple flag; your schema can adapt later)
      await sanity.patch(docId).set({ approved: true, publishedAt: new Date().toISOString() }).commit();
      await TG.send(chatId, `✅ Approved & marked published: <code>${docId}</code>`);
    } else {
      await sanity.patch(docId).set({ approved: false, status: "rejected" }).commit();
      await TG.send(chatId, `❌ Rejected: <code>${docId}</code>`);
    }
  } catch (e) {
    await TG.send(chatId, `Error: <code>${e.message || e}</code>`);
  }
}

export default async function handler(req, res) {
  // Telegram webhook "health check"
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, message: "Telegram webhook OK" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const update = req.body;
    const msg = update?.message || update?.edited_message;
    const chatId = msg?.chat?.id;
    const text = (msg?.text || "").trim();

    // Only you can use the bot
    if (!isAdmin(chatId)) {
      await TG.send(chatId, "Unauthorized. This bot is for the site owner only.");
      return res.status(200).json({ ok: true });
    }

    // Commands
    if (text === "/start") {
      await TG.send(
        chatId,
        [
          "Hi! I'm your Medprephub AI Admin assistant 👋",
          "",
          "Commands:",
          "<code>/ping</code> – check bot is alive",
          "<code>/whoami</code> – show your chat id",
          "<code>/scan</code> – draft a daily update suggestion (approval template)",
          "<code>/approve &lt;id-or-slug&gt;</code> – approve/publish a draft",
          "<code>/reject &lt;id-or-slug&gt;</code> – reject a draft",
        ].join("\n")
      );
      return res.status(200).json({ ok: true });
    }

    if (text === "/ping") {
      await TG.send(chatId, "pong");
      return res.status(200).json({ ok: true });
    }

    if (text === "/whoami") {
      await TG.send(chatId, `Your chat id: <code>${chatId}</code>`);
      return res.status(200).json({ ok: true });
    }

    if (text === "/scan") {
      // For now just send the template. (Later we'll plug in OpenAI + GSC + sources.)
      await TG.send(chatId, dailyTemplate());
      return res.status(200).json({ ok: true });
    }

    // /approve something  OR  /reject something
    const parts = text.split(/\s+/);
    const cmd = parts[0].replace("/", "");
    const arg = parts.slice(1).join(" ").trim();

    if (cmd === "approve" || cmd === "reject") {
      await handleApproveOrReject(cmd, arg, chatId);
      return res.status(200).json({ ok: true });
    }

    // Unknown command
    await TG.send(chatId, "Unknown command. Type /start to see options.");
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ ok: true }); // Telegram expects 200
  }
    }
