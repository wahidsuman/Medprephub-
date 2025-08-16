// pages/api/sanity-test.js
export default function handler(req, res) {
  res.status(200).json({ ok: true, message: "Sanity test route working ✅" });
}
