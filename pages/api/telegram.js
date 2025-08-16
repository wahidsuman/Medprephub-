// pages/api/telegram.js
export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, message: "Telegram webhook OK" });
  }
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const update = req.body;
    console.log("Incoming Telegram update:", JSON.stringify(update));

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error("Missing TELEGRAM_BOT_TOKEN");
      return res.status(200).json({ ok: true });
    }

    const chatId =
      update?.message?.chat?.id ??
      update?.callback_query?.message?.chat?.id ??
      null;

    const text = update?.message?.text ?? "";
    const replyText = text ? `Echo: ${text}` : "Received your message!";

    if (chatId) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText,
        }),
      });
    } else {
      console.error("No chat_id found in update");
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Telegram handler error:", err);
    return res.status(200).json({ ok: true });
  }
}
