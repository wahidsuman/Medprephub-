// pages/api/telegram.js
/* Telegram → GitHub PR bot with natural-language intents.
   Commands it understands:
   - /ping
   - /propose <topic...>
   - /approve  (merges most recent open PR from bot)
   Natural language:
   - "create a post on <topic>"
   - "write about <topic>"
   - "approve the latest PR", "merge it", "go ahead and publish", etc.
*/

import { Octokit } from "@octokit/rest";
import OpenAI from "openai";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID; // your numeric Telegram user id
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;          // PAT (classic) with repo + workflow
const GITHUB_REPO = process.env.GITHUB_REPO;            // e.g. "wahidsuman/Medprephub-"
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
const SITE_CONTENT_DIR = process.env.SITE_CONTENT_DIR || "content/posts"; // markdown folder

// ------ helpers ------
async function sendTG(chatId, text, opts = {}) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const body = { chat_id: chatId, text, parse_mode: "Markdown", ...opts };
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return res.json();
}

function isAdmin(chatId) {
  return String(chatId) === String(ADMIN_CHAT_ID);
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

// Draft markdown using OpenAI
async function draftMarkdown(topic) {
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  const prompt = `Write a concise, high-quality Markdown blog post for a medical exam prep website.
Topic: ${topic}
Audience: NEET PG / INI-CET / FMGE aspirants.
Include:
- short intro
- 4–6 key points in bullet form
- 4 MCQs with answers & brief explanations
- a short "Takeaway" section.
Use headings and lists. Keep it factual, no fluff.`;

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const content = resp.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("OpenAI returned empty content");
  return content;
}

// Create PR that adds a new .md file
async function createPostPR({ topic, markdown, author = "bot" }) {
  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  const [owner, repo] = GITHUB_REPO.split("/");

  // 1) get base sha
  const { data: baseRef } = await octokit.git.getRef({ owner, repo, ref: `heads/${GITHUB_BRANCH}` });
  const baseSha = baseRef.object.sha;

  // 2) create feature branch
  const branchName = `bot/post-${slugify(topic)}-${Date.now()}`;
  await octokit.git.createRef({
    owner, repo, ref: `refs/heads/${branchName}`, sha: baseSha,
  });

  // 3) create file on branch
  const dated = new Date().toISOString().slice(0, 10);
  const filename = `${SITE_CONTENT_DIR}/${dated}-${slugify(topic)}.md`;
  const contentB64 = Buffer.from(markdown, "utf8").toString("base64");

  await octokit.repos.createOrUpdateFileContents({
    owner, repo, path: filename, message: `feat(posts): add ${topic}`,
    content: contentB64, branch: branchName, committer: { name: "AI Manager", email: "bot@local" }, author: { name: "AI Manager", email: "bot@local" },
  });

  // 4) open PR
  const { data: pr } = await octokit.pulls.create({
    owner, repo, head: branchName, base: GITHUB_BRANCH,
    title: `Add post: ${topic}`,
    body: `Proposed automatically by AI Manager.\n\nTopic: **${topic}**\nFile: \`${filename}\``,
  });

  return { prNumber: pr.number, prUrl: pr.html_url };
}

// Merge newest open PR created by the bot
async function mergeLatestPR() {
  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  const [owner, repo] = GITHUB_REPO.split("/");

  const { data: prs } = await octokit.pulls.list({ owner, repo, state: "open", sort: "created", direction: "desc", per_page: 10 });
  if (!prs.length) return { merged: false, message: "No open PRs to merge." };

  const pr = prs[0];
  const { data: merged } = await octokit.pulls.merge({ owner, repo, pull_number: pr.number, merge_method: "squash" });
  return { merged: merged.merged, prNumber: pr.number, prUrl: pr.html_url };
}

// Very small intent parser
function parseIntent(text) {
  const t = text.trim();

  // explicit slash commands
  const mPropose = t.match(/^\/propose\s+(.+)/i);
  if (mPropose) return { action: "propose", topic: mPropose[1].trim() };

  if (/^\/approve\b/i.test(t)) return { action: "approve" };
  if (/^\/ping\b/i.test(t)) return { action: "ping" };

  // natural language
  const mCreate = t.match(/\b(create|write|draft|generate)\b.*\b(post|article)\b.*\b(on|about)\b\s+(.+)/i);
  if (mCreate) return { action: "propose", topic: mCreate[4].trim() };

  const mApprove = t.match(/\b(approve|merge|publish)\b.*(pr|pull request)?/i);
  if (mApprove) return { action: "approve" };

  return { action: "chat", text: t };
}

// Generic chat fallback (optional)
async function smallTalk(text) {
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a concise website manager assistant for a medical exam prep site. Keep replies short and helpful." },
      { role: "user", content: text },
    ],
    temperature: 0.3,
  });
  return resp.choices?.[0]?.message?.content?.trim() || "Okay.";
}

// ------ handler ------
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
  try {
    // Telegram update
    const update = req.body;
    const msg = update.message || update.edited_message;
    if (!msg || !msg.text) return res.status(200).json({ ok: true });

    const chatId = msg.chat.id;
    const text = msg.text;

    // only you (admin) can control publishing
    if (!isAdmin(chatId)) {
      await sendTG(chatId, "Sorry, this admin bot is private.");
      return res.status(200).json({ ok: true });
    }

    const intent = parseIntent(text);

    // /ping
    if (intent.action === "ping") {
      await sendTG(chatId, "✅ Bot is alive.");
      return res.status(200).json({ ok: true });
    }

    // propose → draft + PR
    if (intent.action === "propose") {
      const topic = intent.topic;
      if (!topic) {
        await sendTG(chatId, "Please provide a topic, e.g. `/propose acute pancreatitis`");
        return res.status(200).json({ ok: true });
      }
      await sendTG(chatId, `✍️ Drafting post on *${topic}*…`);
      const md = await draftMarkdown(topic);
      const { prNumber, prUrl } = await createPostPR({ topic, markdown: md });
      await sendTG(chatId, `📬 Opened PR **#${prNumber}** for *${topic}*.\nReview & approve:\n${prUrl}`);
      return res.status(200).json({ ok: true });
    }

    // approve → merge latest open PR
    if (intent.action === "approve") {
      await sendTG(chatId, "🔄 Merging the most recent open PR…");
      const { merged, prNumber, prUrl, message } = await mergeLatestPR();
      if (!merged) {
        await sendTG(chatId, `⚠️ ${message || "Merge failed."}`);
      } else {
        await sendTG(chatId, `✅ Merged PR #${prNumber}.\n${prUrl}`);
      }
      return res.status(200).json({ ok: true });
    }

    // fallback chat
    const reply = await smallTalk(intent.text);
    await sendTG(chatId, reply);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Telegram handler error:", err);
    try {
      const chatId = req?.body?.message?.chat?.id;
      if (chatId) await sendTG(chatId, `⚠️ Error: ${err.message}`);
    } catch {}
    return res.status(200).json({ ok: true });
  }
}
