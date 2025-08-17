
// pages/api/manager/execute.js
import { askOpenAI } from "../../../lib/openai";
import { upsertPost } from "../../../lib/github";
import { tgSend } from "../../../lib/telegram";

const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { command, task_type } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: "No command provided" });
    }

    let result;

    switch (task_type) {
      case "content_generation":
        result = await generateContent(command);
        break;
      case "ui_improvement":
        result = await suggestUIChanges(command);
        break;
      case "seo_optimization":
        result = await optimizeSEO(command);
        break;
      default:
        result = await handleGeneralCommand(command);
    }

    if (CHAT_ID) {
      await tgSend(CHAT_ID, result.message);
    }

    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error("Execute error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function generateContent(command) {
  const contentPrompt = `
User request: "${command}"

Generate a comprehensive medical education post for NEET PG/FMGE students.

Provide:
1. SEO-optimized title
2. Meta description
3. Full HTML content with proper headings, lists, internal links
4. Relevant tags
5. Target keywords

Focus on accuracy, exam relevance, and student engagement.
`;

  const content = await askOpenAI({
    system: "You are a medical education content expert for NEET PG preparation.",
    user: contentPrompt,
    max_tokens: 1500,
    temperature: 0.7
  });

  // Extract structured data from AI response
  const title = extractBetween(content, "TITLE:", "\n");
  const markdown = formatAsMarkdown(content, title);

  // Create GitHub PR for the new post
  const result = await upsertPost({
    title: title || "New Medical Post",
    markdown,
    viaPR: true
  });

  return {
    message: `✅ Created content PR: ${result.prUrl}\n\nPreview:\n${title}`,
    pr_url: result.prUrl
  };
}

async function suggestUIChanges(command) {
  const uiPrompt = `
User wants: "${command}"

Provide specific UI/UX improvements for a medical education website:

1. Exact components to modify
2. CSS/styling changes needed
3. User experience improvements
4. Mobile responsiveness considerations

Be specific and actionable.
`;

  const suggestions = await askOpenAI({
    system: "You are a UX expert specializing in educational websites.",
    user: uiPrompt,
    max_tokens: 800
  });

  return {
    message: `🎨 UI Improvement Plan:\n\n${suggestions}\n\nShould I create a PR with these changes? Reply YES to proceed.`
  };
}

async function optimizeSEO(command) {
  const seoPrompt = `
SEO task: "${command}"

Provide specific SEO optimizations for a NEET PG preparation website:

1. Target keywords to focus on
2. Content optimization suggestions
3. Technical SEO improvements
4. Internal linking strategy
5. Meta tag improvements

Be specific and measurable.
`;

  const seoAdvice = await askOpenAI({
    system: "You are an SEO specialist for medical education websites.",
    user: seoPrompt,
    max_tokens: 1000
  });

  return {
    message: `📈 SEO Optimization Plan:\n\n${seoAdvice}\n\nReady to implement? Reply YES to start.`
  };
}

async function handleGeneralCommand(command) {
  const generalPrompt = `
User request: "${command}"

You are an AI Website Manager for MedPrepHub. Analyze this request and:

1. Determine what type of task this is (content, UI, SEO, technical)
2. Provide step-by-step plan to accomplish it
3. Estimate timeline and resources needed
4. Ask for any clarifications needed

Be helpful and proactive.
`;

  const response = await askOpenAI({
    system: "You are a proactive AI website manager assistant.",
    user: generalPrompt,
    max_tokens: 800
  });

  return {
    message: `🤖 Analysis:\n\n${response}`
  };
}

// Helper functions
function extractBetween(text, start, end) {
  const startIndex = text.indexOf(start);
  if (startIndex === -1) return "";
  const endIndex = text.indexOf(end, startIndex + start.length);
  return text.slice(startIndex + start.length, endIndex > -1 ? endIndex : undefined).trim();
}

function formatAsMarkdown(content, title) {
  const date = new Date().toISOString();
  return `---
title: "${title}"
date: "${date}"
tags: ["neet-pg", "medical-education"]
---

${content}
`;
}
