// pages/api/manager/propose.js
import { tgSend } from "../../../lib/telegram";

const OWNER_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Simple daily proposal (stub data). We'll replace this with AI later.
export default async function handler(req, res) {
  const today = new Date().toISOString().slice(0, 10);

  const payload = {
    id: `prop-${Date.now()}`,
    date: today,
    newContent: [
      { title: "INI-CET August 2025 Registration Window", summary: "Dates, eligibility, and key changes." },
      { title: "FMGE Pharmacology Rapid Review – Autonomics", summary: "20 high-yield points + 5 MCQs." }
    ],
    updates: [
      { url: "/blog/neet-pg-eligibility", suggestion: "Refresh counselling dates, add FAQ schema." }
    ],
    seo: ["ini-cet 2025 registration", "fmge autonomic drugs notes"]
  };

  global.latestProposal = payload; // in-memory

  const lines = [
    "📢 <b>Daily Website Update Suggestions</b>",
    `Date: ${today}`,
    "",
    "<b>New Content Ready:</b>",
    ...payload.newContent.map((x,i)=>`${i+1}. ${x.title} – ${x.summary}`),
    "",
    "<b>Updates to Existing Posts:</b>",
    ...payload.updates.map((x,i)=>`${i+1}. ${x.url} – ${x.suggestion}`),
    "",
    "<b>SEO Suggestions:</b>",
    `- ${payload.seo.join(", ")}`,
    "",
    "Do you approve posting these changes? (YES/NO)",
  ].join("\n");

  if (OWNER_CHAT_ID) await tgSend(OWNER_CHAT_ID, lines);
  return res.status(200).json({ ok: true, sent: !!OWNER_CHAT_ID, proposalId: payload.id });
}
