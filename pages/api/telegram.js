export default async function handler(req, res) {
  if (req.method === "POST") {
    const { message } = req.body;

    if (message && message.text) {
      // Example: Reply with same text
      const chatId = message.chat.id;
      const text = `You said: ${message.text}`;

      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
    }
  }
  res.status(200).send("OK");
}
