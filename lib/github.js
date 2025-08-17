// lib/github.js
// Minimal GitHub client used by the Telegram bot to open draft PRs.
// Requires env: GITHUB_TOKEN, GITHUB_REPO (owner/repo), GITHUB_BRANCH

import { Octokit } from "@octokit/rest";

const REQUIRED_ENVS = ["GITHUB_TOKEN", "GITHUB_REPO", "GITHUB_BRANCH"];
for (const k of REQUIRED_ENVS) {
  if (!process.env[k]) {
    console.warn(`[github] Missing env ${k}`);
  }
}

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: "medprephub-bot/1.0",
});

const [OWNER, REPO] = (process.env.GITHUB_REPO || "").split("/");
const BASE_BRANCH = process.env.GITHUB_BRANCH || "main";

function b64(str) {
  return Buffer.from(str, "utf8").toString("base64");
}

export function safeBranchName(prefix = "bot") {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return `${prefix}/${ts}`;
}

async function getBranchSha(branch) {
  const { data } = await octokit.repos.getBranch({
    owner: OWNER,
    repo: REPO,
    branch,
  });
  return data.commit.sha;
}

async function createBranch(fromBranch, newBranch) {
  const sha = await getBranchSha(fromBranch);
  await octokit.git.createRef({
    owner: OWNER,
    repo: REPO,
    ref: `refs/heads/${newBranch}`,
    sha,
  });
}

async function getFileShaIfExists(path, branch) {
  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path,
      ref: branch,
    });
    // Only when the item is a file
    if (!Array.isArray(data) && data.sha) return data.sha;
    return null;
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function commitFile({
  branch,
  path,
  content,
  message,
}) {
  const existingSha = await getFileShaIfExists(path, branch);

  const res = await octokit.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path,
    branch,
    message,
    content: b64(content),
    sha: existingSha || undefined,
    committer: { name: "Medprephub Bot", email: "bot@medprephub.local" },
    author: { name: "Medprephub Bot", email: "bot@medprephub.local" },
  });

  return res.data;
}

export async function openDraftPR({
  title,
  body,
  headBranch,
  baseBranch = BASE_BRANCH,
}) {
  const { data } = await octokit.pulls.create({
    owner: OWNER,
    repo: REPO,
    title,
    body,
    head: headBranch,
    base: baseBranch,
    draft: true,
  });
  return { number: data.number, url: data.html_url };
}

export async function createChangeWithPR({ filePath, fileContent, title, body }) {
  // 1) create a working branch off BASE_BRANCH
  const headBranch = safeBranchName("proposal");
  await createBranch(BASE_BRANCH, headBranch);

  // 2) commit the file change
  await commitFile({
    branch: headBranch,
    path: filePath,
    content: fileContent,
    message: title,
  });

  // 3) open draft PR
  const pr = await openDraftPR({ title, body, headBranch });

  return { headBranch, prNumber: pr.number, prUrl: pr.url };
    }
