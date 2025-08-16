// pages/api/cron.js
export default async function handler(req, res) {
  try {
    const chatId = process.env.TELEGRAM_CHAT_ID; // now required from env
    if (!chatId) {
      return res.status(500).json({ ok: false, error: "TELEGRAM_CHAT_ID missing" });
    }

    const text = "⏰ Cron job executed! Hello from Vercel";

    const tgRes = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      }
    );

    const data = await tgRes.json();
    return res.status(200).json({ ok: true, telegram: data });
  } catch (err) {
    console.error("Cron error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
