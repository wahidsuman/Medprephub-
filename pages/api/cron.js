export default async function handler(req, res) {
  // Allow manual GET for testing in the browser, and POST (Vercel Cron).
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const ADMIN_ID = Number(process.env.ADMIN_TELEGRAM_ID);
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  const today = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });

  const message =
`📢 **Daily Website Update Suggestions**
Date: ${today}

**New Content Ready:**
1. Welcome to Medprephub – Short intro post (demo)

**Updates to Existing Posts:**
1. /blog – Improve meta description (demo)

**SEO Suggestions:**
- "neet pg anatomy mnemonics", "fmge image-based questions"

Do you approve posting these changes? (YES/NO)
`;

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: ADMIN_ID,
      text: message,
      parse_mode: "Markdown"
    })
  });

  return res.status(200).json({ ok: true, sent: true });
}
