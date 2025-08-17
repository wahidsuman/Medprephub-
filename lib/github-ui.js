
// lib/github-ui.js
const fetch = require("node-fetch");

const owner = process.env.GITHUB_REPO_OWNER;
const repo = process.env.GITHUB_REPO;
const token = process.env.GITHUB_TOKEN;

async function createUIChangePR({ title, description, files }) {
  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;
  
  try {
    // Get main branch reference
    const mainRefResp = await fetch(`${apiBase}/git/ref/heads/main`, {
      headers: { Authorization: `token ${token}` }
    });
    const mainRef = await mainRefResp.json();

    // Create new branch for UI changes
    const branchName = `ui-${Date.now()}`;
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

    // Commit each file change
    for (const file of files) {
      // Check if file exists to get SHA
      let sha = null;
      const getFileResp = await fetch(`${apiBase}/contents/${file.path}`, {
        headers: { Authorization: `token ${token}` }
      });
      
      if (getFileResp.status === 200) {
        const fileData = await getFileResp.json();
        sha = fileData.sha;
      }

      // Create/update file
      const content = Buffer.from(file.content).toString("base64");
      await fetch(`${apiBase}/contents/${file.path}`, {
        method: "PUT",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `UI: ${file.description || `Update ${file.path}`}`,
          content,
          branch: branchName,
          sha: sha || undefined,
        }),
      });
    }

    // Create pull request
    const prResp = await fetch(`${apiBase}/pulls`, {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `🎨 UI: ${title}`,
        head: branchName,
        base: "main",
        body: `${description}\n\n## Files Changed:\n${files.map(f => `- ${f.path}: ${f.description || 'Updated'}`).join('\n')}\n\n---\n*This PR was created automatically by your AI Website Manager*`
      }),
    });

    const pr = await prResp.json();
    return { 
      prUrl: pr.html_url, 
      prNumber: pr.number,
      branchName 
    };

  } catch (error) {
    console.error("GitHub UI PR error:", error);
    throw error;
  }
}

async function mergePR(prNumber) {
  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;
  
  const mergeResp = await fetch(`${apiBase}/pulls/${prNumber}/merge`, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      commit_title: "UI: Merge approved changes",
      merge_method: "squash"
    }),
  });

  return await mergeResp.json();
}

async function closePR(prNumber) {
  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;
  
  const closeResp = await fetch(`${apiBase}/pulls/${prNumber}`, {
    method: "PATCH",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      state: "closed"
    }),
  });

  return await closeResp.json();
}

module.exports = { 
  createUIChangePR, 
  mergePR, 
  closePR 
};
