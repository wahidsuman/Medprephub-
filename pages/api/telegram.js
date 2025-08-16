// /pages/api/telegram.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, message: "Telegram webhook OK" });
  }

  try {
    const update = req.body;
    const msg = update?.message;
    const chatId = msg?.chat?.id;
    const text = (msg?.text || "").trim();

    // Only respond to your admin chat
    const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    if (!chatId || String(chatId) !== String(ADMIN_CHAT_ID)) {
      return res.status(200).send("OK");
    }

    const send = (t) =>
      fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: t }),
      });

    // Basic commands
    if (/^\/ping$/i.test(text)) {
      await send("✅ Bot is working");
      return res.status(200).send("OK");
    }
    if (/^\/whoami$/i.test(text)) {
      await send(`Your ID: ${chatId}`);
      return res.status(200).send("OK");
    }
    if (/^\/start$/i.test(text)) {
      await send("👋 Hi! I am your site admin bot. Try /ping or reply YES/NO to approve plans.");
      return res.status(200).send("OK");
    }

    // Approval flow
    if (/^YES$/i.test(text)) {
      // Call approve endpoint
      await fetch(`${process.env.SITE_URL}/api/manager/approve?decision=YES`);
      // (SITE_URL should be set to your https://medprephub.vercel.app)
      return res.status(200).send("OK");
    }
    if (/^NO$/i.test(text)) {
      await send("❌ Approval declined. No changes published.");
      return res.status(200).send("OK");
    }

    // Default echo
    await send(`Echo: ${text}`);
    return res.status(200).send("OK");
  } catch (err) {
    console.error("Telegram handler error:", err);
    return res.status(200).send("OK");
  }
}
