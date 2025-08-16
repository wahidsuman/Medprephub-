// pages/api/telegram.js
export default async function handler(req, res) {
  // 1) Let Telegram's webhook check pass (fixes 405)
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, message: 'Telegram webhook OK' });
  }

  // Only accept POST for actual updates
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true }); // be lenient
  }

  // 2) Verify secret header (optional but recommended)
  const secret = req.headers['x-telegram-bot-api-secret-token'];
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return res.status(401).json({ ok: false, error: 'secret mismatch' });
  }

  const update = req.body || {};
  const msg = update.message;
  if (!msg) return res.status(200).json({ ok: true });

  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const text = (msg.text || '').trim();

  // 3) Restrict to owner
  if (process.env.TELEGRAM_OWNER_ID && String(userId) !== String(process.env.TELEGRAM_OWNER_ID)) {
    await sendMessage('❌ Sorry, you are not authorized to use this bot.', chatId);
    return res.status(200).json({ ok: true });
  }

  // 4) Simple commands
  let reply = 'Unknown command. Try /start /ping /whoami';
  if (text.startsWith('/start')) reply = 'Hi! I am your site admin bot. Try /ping or /whoami';
  else if (text.startsWith('/ping')) reply = '✅ Bot is working';
  else if (text.startsWith('/whoami')) reply = `Your ID: ${userId}`;

  await sendMessage(reply, chatId);
  return res.status(200).json({ ok: true });
}

async function sendMessage(text, chatId) {
  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (e) {
    // ignore send errors to keep webhook fast
  }
}
