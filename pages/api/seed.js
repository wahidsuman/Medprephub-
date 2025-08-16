import { client } from "../../lib/sanity";

export default async function handler(req, res) {
  try {
    // A simple first post
    const doc = {
      _id: "post-welcome",      // stable id so we don't create duplicates
      _type: "post",
      title: "Welcome to Medprephub",
      slug: { _type: "slug", current: "welcome" },
      body: "This is your first post created from Next.js using the server token.",
      _createdAt: new Date().toISOString()
    };

    const created = await client.createIfNotExists(doc);
    return res.status(200).json({ ok: true, id: created._id });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
