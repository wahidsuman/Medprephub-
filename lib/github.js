// lib/github.js
const fetch = require("node-fetch");

const owner = process.env.GITHUB_REPO_OWNER;
const repo = process.env.GITHUB_REPO;
const token = process.env.GITHUB_TOKEN;

async function upsertPost({ title, markdown, viaPR = true }) {
  const filePath = `content/posts/${title.toLowerCase().replace(/\s+/g, "-")}.md`;
  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;
  
  // Step 1: check if file exists
  let sha = null;
  const getResp = await fetch(`${apiBase}/contents/${filePath}`, {
    headers: { Authorization: `token ${token}` }
  });
  if (getResp.status === 200) {
    const data = await getResp.json();
    sha = data.sha; // keep sha for update
  }

  // Step 2: prepare content
  const content = Buffer.from(markdown).toString("base64");

  if (viaPR) {
    // Create a new branch for PR
    const mainRefResp = await fetch(`${apiBase}/git/ref/heads/main`, {
      headers: { Authorization: `token ${token}` }
    });
    const mainRef = await mainRefResp.json();

    const branchName = `post-${Date.now()}`;
    await fetch(`${apiBase}/git/refs`, {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: mainRef.object.sha,
      }),
    });

    // Commit file to new branch
    await fetch(`${apiBase}/contents/${filePath}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Add post: ${title}`,
        content,
        branch: branchName,
        sha: sha || undefined,
      }),
    });

    // Create pull request
    const prResp = await fetch(`${apiBase}/pulls`, {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `New post: ${title}`,
        head: branchName,
        base: "main",
      }),
    });

    const pr = await prResp.json();
    return { prUrl: pr.html_url, prNumber: pr.number };
  } else {
    // Direct commit to main
    const commitResp = await fetch(`${apiBase}/contents/${filePath}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Publish post: ${title}`,
        content,
        branch: "main",
        sha: sha || undefined,
      }),
    });

    const commit = await commitResp.json();
    return { url: commit.content?.html_url };
  }
}

module.exports = { upsertPost };
