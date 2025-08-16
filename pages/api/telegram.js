// pages/api/telegram.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, message: "Telegram webhook OK" });
  }

  try {
    const update = req.body;
    const message = update?.message;
    if (!message) return res.status(200).send("OK");

    const chatId = message.chat.id;
    const text = (message.text || "").trim();

    // 🔑 Admin ID (replace with your own or put in process.env.ADMIN_ID)
    const ADMIN_ID = 1044834121;

    let reply = "";

    switch (text) {
      case "/start":
        reply = "👋 Hi! I am your site admin bot.\nTry /ping or /whoami.";
        break;

      case "/ping":
        reply = "✅ Bot is working";
        break;

      case "/whoami":
        reply = `Your ID: ${chatId}`;
        break;

      // Example admin-only command
      case "/secret":
        if (chatId === ADMIN_ID) {
          reply = "🔒 Welcome Admin! You can access secret commands here.";
        } else {
          reply = "🚫 You are not authorized to use this command.";
        }
        break;

      default:
        reply = `❓ Unknown command.\nAvailable: /ping, /whoami, /start`;
        break;
    }

    // Send reply back
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: reply }),
      }
    );

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Telegram handler error:", err);
    return res.status(200).send("OK");
  }
}
