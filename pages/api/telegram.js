export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, message: "Telegram webhook OK" });
  }

  try {
    const update = req.body;
    const msg = update?.message;
    if (!msg) return res.status(200).send("OK");

    const chatId = msg.chat.id;
    const text = (msg.text || "").trim();
    const ADMIN_ID = Number(process.env.ADMIN_TELEGRAM_ID);

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
      case "/secret":
        reply = chatId === ADMIN_ID
          ? "🔒 Welcome Admin! Secret commands ready."
          : "🚫 You are not authorized to use this command.";
        break;
      default:
        reply = "❓ Unknown command. Available: /start /ping /whoami";
    }

    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: reply })
    });

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Telegram handler error:", err);
    return res.status(200).send("OK");
  }
}
