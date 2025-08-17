// lib/github.js
// Requires: @octokit/rest, slugify (already in your package.json)

const { Octokit } = require("@octokit/rest");
const slugify = require("slugify");

// ---- Env ----
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // PAT (classic) with repo + workflow scopes
const REPO_FULL = process.env.GITHUB_REPO;     // e.g. "wahidsuman/Medprephub-"
const DEFAULT_BRANCH = process.env.GITHUB_BRANCH || "main";
const CONTENT_DIR = process.env.SITE_CONTENT_DIR || "content/posts";

if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is missing");
if (!REPO_FULL || !REPO_FULL.includes("/")) throw new Error("GITHUB_REPO must be like owner/repo");

const [OWNER, REPO] = REPO_FULL.split("/");

function octo() {
  return new Octokit({ auth: GITHUB_TOKEN });
}

// --- helpers ---

async function getFileSha(path, branch = DEFAULT_BRANCH) {
  const o = octo();
  try {
    const res = await o.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path,
      ref: branch,
    });
    // When path is a file, data is an object with .sha
    return res.data && res.data.sha ? res.data.sha : null;
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

async function getBranchSha(branch) {
  const o = octo();
  const ref = await o.git.getRef({
    owner: OWNER,
    repo: REPO,
    ref: `heads/${branch}`,
  });
  return ref.data.object.sha;
}

async function ensureBranch(branch) {
  if (branch === DEFAULT_BRANCH) return; // main already exists
  const o = octo();
  try {
    await o.git.getRef({ owner: OWNER, repo: REPO, ref: `heads/${branch}` });
    return; // exists
  } catch (err) {
    if (err.status !== 404) throw err;
  }
  // create from default branch tip
  const baseSha = await getBranchSha(DEFAULT_BRANCH);
  await o.git.createRef({
    owner: OWNER,
    repo: REPO,
    ref: `refs/heads/${branch}`,
    sha: baseSha,
  });
}

async function createOrUpdateFile({ path, content, message, branch = DEFAULT_BRANCH }) {
  const o = octo();
  const existingSha = await getFileSha(path, branch);
  const params = {
    owner: OWNER,
    repo: REPO,
    path,
    message: message || `chore: update ${path}`,
    content: Buffer.from(content).toString("base64"),
    branch,
  };
  if (existingSha) params.sha = existingSha; // only include when updating
  const res = await o.repos.createOrUpdateFileContents(params);
  return res.data; // returns {content, commit}
}

async function openPullRequest({ branch, title, body }) {
  const o = octo();
  // Try to find existing open PR from branch to default
  const existing = await o.pulls.list({
    owner: OWNER,
    repo: REPO,
    state: "open",
    head: `${OWNER}:${branch}`,
    base: DEFAULT_BRANCH,
  });
  if (existing.data.length) return existing.data[0];

  const pr = await o.pulls.create({
    owner: OWNER,
    repo: REPO,
    title: title || `Content update from ${branch}`,
    head: branch,
    base: DEFAULT_BRANCH,
    body: body || "",
    maintainer_can_modify: true,
  });
  return pr.data;
}

// ---- public API ----

/**
 * Upsert (create or update) a Markdown post.
 * If viaPR=true, commits to a temp branch and opens/returns a PR.
 */
async function upsertPost({
  title,
  markdown,          // full .md content
  slug,               // optional; will be generated from title if missing
  viaPR = true,       // create PR by default
  branchName,         // optional explicit branch name
  filename,           // optional <slug>.md override
}) {
  if (!markdown) throw new Error("markdown content is required");
  const safeSlug =
    slug ||
    slugify(title || `post-${Date.now()}`, { lower: true, strict: true });
  const file = filename || `${safeSlug}.md`;
  const postPath = `${CONTENT_DIR.replace(/\/+$/, "")}/${file}`;

  const branch = viaPR
    ? branchName || `content/${safeSlug}-${Date.now()}`
    : DEFAULT_BRANCH;

  if (viaPR) await ensureBranch(branch);

  const message = (await getFileSha(postPath, viaPR ? branch : DEFAULT_BRANCH))
    ? `content: update ${file}`
    : `content: add ${file}`;

  const result = await createOrUpdateFile({
    path: postPath,
    content: markdown,
    message,
    branch,
  });

  if (!viaPR) {
    return {
      ok: true,
      branch,
      path: postPath,
      committedSha: result.commit && result.commit.sha,
      url: `https://github.com/${OWNER}/${REPO}/blob/${branch}/${postPath}`,
    };
  }

  const pr = await openPullRequest({
    branch,
    title: `Add: ${title || safeSlug}`,
    body: `Automated content proposal for **${title || safeSlug}**.\n\n- File: \`${postPath}\`\n- Commit: ${result.commit && result.commit.sha}`,
  });

  return {
    ok: true,
    branch,
    path: postPath,
    prNumber: pr.number,
    prUrl: pr.html_url,
  };
}

module.exports = {
  upsertPost,
  createOrUpdateFile,
  openPullRequest,
};
