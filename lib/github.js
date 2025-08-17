// lib/github.js
const { Octokit } = require("@octokit/rest");
const slugify = require("slugify");

/**
 * ENV needed (set in Vercel):
 * - GITHUB_TOKEN        : PAT (classic) with repo + workflow
 * - GITHUB_REPO         : e.g. "wahidsuman/Medprephub-"
 * - GITHUB_BRANCH       : base branch to merge into (default: "main")
 * - SITE_CONTENT_DIR    : where posts live (default: "content/posts")
 */

function getConfig() {
  const {
    GITHUB_TOKEN,
    GITHUB_REPO,
    GITHUB_BRANCH = "main",
    SITE_CONTENT_DIR = "content/posts",
  } = process.env;

  if (!GITHUB_TOKEN) throw new Error("Missing env GITHUB_TOKEN");
  if (!GITHUB_REPO || !GITHUB_REPO.includes("/"))
    throw new Error('GITHUB_REPO must be like "owner/repo"');

  const [owner, repo] = GITHUB_REPO.split("/");
  return {
    GITHUB_TOKEN,
    owner,
    repo,
    baseBranch: GITHUB_BRANCH,
    contentDir: SITE_CONTENT_DIR.replace(/^\/+|\/+$/g, ""), // trim slashes
  };
}

function toMarkdown({ title, body, tags = [], date = new Date() }) {
  const fmLines = [
    "---",
    `title: "${title.replace(/"/g, '\\"')}"`,
    `date: "${date.toISOString()}"`,
    tags.length ? `tags: [${tags.map((t) => `"${t}"`).join(", ")}]` : "tags: []",
    "---",
    "",
  ];
  return fmLines.join("\n") + body.trim() + "\n";
}

async function ensureBranch(octokit, { owner, repo, baseBranch }, newBranch) {
  // get base ref sha
  const baseRef = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`,
  });
  const sha = baseRef.data.object.sha;

  // try create new branch; if exists, continue
  try {
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${newBranch}`,
      sha,
    });
  } catch (err) {
    const exists =
      err?.status === 422 &&
      /Reference already exists/.test(err?.response?.data?.message || "");
    if (!exists) throw err;
  }
}

async function createPostPR({
  title,
  body,
  tags = [],
  suggestedSlug, // optional
}) {
  const cfg = getConfig();
  const octokit = new Octokit({ auth: cfg.GITHUB_TOKEN });

  const slug =
    suggestedSlug ||
    slugify(title, { lower: true, strict: true }) ||
    `post-${Date.now()}`;
  const filename = `${slug}.md`;
  const postPath = `${cfg.contentDir}/${filename}`;
  const branchName = `bot/post-${slug}`;

  // 1) ensure working branch from base
  await ensureBranch(octokit, cfg, branchName);

  // 2) write file on that branch
  const content = toMarkdown({ title, body, tags });
  const b64 = Buffer.from(content, "utf8").toString("base64");

  // If the file already exists on the branch, update; else create
  let sha;
  try {
    const existing = await octokit.repos.getContent({
      owner: cfg.owner,
      repo: cfg.repo,
      path: postPath,
      ref: branchName,
    });
    sha = Array.isArray(existing.data) ? undefined : existing.data.sha;
  } catch (_) {
    // not found -> create new
  }

  await octokit.repos.createOrUpdateFileContents({
    owner: cfg.owner,
    repo: cfg.repo,
    path: postPath,
    message: `feat: add post "${title}"`,
    content: b64,
    branch: branchName,
    sha, // only set when updating
  });

  // 3) open (or reuse) PR
  const prs = await octokit.pulls.list({
    owner: cfg.owner,
    repo: cfg.repo,
    head: `${cfg.owner}:${branchName}`,
    state: "open",
    base: cfg.baseBranch,
  });

  let pr;
  if (prs.data.length > 0) {
    pr = prs.data[0];
  } else {
    pr = (
      await octokit.pulls.create({
        owner: cfg.owner,
        repo: cfg.repo,
        head: branchName,
        base: cfg.baseBranch,
        title: `New post: ${title}`,
        body:
          "This PR was opened by the AI Website Manager.\n\n" +
          `- **File:** \`${postPath}\`\n` +
          `- **Slug:** \`${slug}\`\n\n` +
          "Reply **/approve <PR number>** in Telegram to merge, or **/close <PR number>** to close.",
      })
    ).data;
  }

  return {
    prNumber: pr.number,
    prUrl: pr.html_url,
    branch: branchName,
    path: postPath,
    slug,
  };
}

module.exports = {
  createPostPR,
};
export async function mergePR(prNumber) {
  const { Octokit } = await import("@octokit/rest");
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  const [owner, repo] = (process.env.GITHUB_REPO || "").split("/");
  if (!owner || !repo) throw new Error("GITHUB_REPO must be like owner/repo");

  const res = await octokit.pulls.merge({
    owner,
    repo,
    pull_number: prNumber,
    merge_method: "squash",
  });

  return res.data; // { merged: boolean, message: string, ... }
}
