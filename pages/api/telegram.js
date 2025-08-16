export default async function handler(req, res) {
  console.log("Incoming Telegram update:", req.body);

  if (req.method === "POST") {
    res.status(200).json({ ok: true });
  } else {
    res.status(200).json({ ok: true, message: "Telegram webhook OK" });
  }
}
