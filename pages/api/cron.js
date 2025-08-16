export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID; // keep as string
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  const today = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });

  const message =
`Daily Website Update Suggestions
Date: ${today}

New Content Ready:
1. Welcome to Medprephub – Short intro post (demo)

Updates to Existing Posts:
1. /blog – Improve meta description (demo)

SEO Suggestions:
- neet pg anatomy mnemonics, fmge image-based questions

Do you approve posting these changes? (YES/NO)`;

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: ADMIN_ID, text: message })
    });

    const data = await tgRes.json();
    // Helpful log you can see in Vercel → Logs
    console.log("Telegram sendMessage response:", data);

    return res.status(200).json({ ok: true, tgOk: data.ok === true, telegram: data });
  } catch (e) {
    console.error("Cron error:", e);
    return res.status(200).json({ ok: false, error: String(e) });
  }
}
