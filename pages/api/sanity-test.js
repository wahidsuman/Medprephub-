// pages/api/sanity-test.js
import { sanity } from "../../lib/sanity";

export default async function handler(req, res) {
  try {
    const query = `*[_type == "post"][0...1]{title, "id": _id}`;
    const data = await sanity.fetch(query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
