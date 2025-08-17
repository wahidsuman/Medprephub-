
// pages/api/manager/execute.js
import { askOpenAI } from "../../../lib/openai";
import { upsertPost } from "../../../lib/github";
import { createUIChangePR } from "../../../lib/github-ui";
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
User request: "${command}"

You are a UI/UX expert for a NEET PG medical education website. Generate actual code changes.

Current stack: Next.js, React, CSS modules/inline styles

Generate COMPLETE, WORKING code for:

1. If CSS changes needed: Complete CSS file content
2. If component changes needed: Complete React component file content  
3. If new components needed: Complete new component code
4. If layout changes needed: Complete layout file content

Focus on:
- Clean, modern medical education UI
- Mobile-responsive design
- Better user engagement
- Professional appearance for students

Provide response in this format:

FILE_CHANGES:
---
FILE: path/to/file.css
DESCRIPTION: Brief description
CONTENT:
[complete file content here]
---
FILE: path/to/component.js  
DESCRIPTION: Brief description
CONTENT:
[complete file content here]
---

Be specific with actual file paths that exist in a Next.js project.
`;

  const aiResponse = await askOpenAI({
    system: "You are a senior frontend developer specializing in educational websites. Generate production-ready code.",
    user: uiPrompt,
    max_tokens: 2000,
    temperature: 0.3
  });

  // Parse AI response to extract file changes
  const files = parseUIChanges(aiResponse);
  
  if (files.length === 0) {
    return {
      message: `🎨 UI Analysis:\n\n${aiResponse}\n\nNo specific code changes identified. Can you be more specific about what you'd like to change?`
    };
  }

  try {
    // Create GitHub PR with the changes
    const result = await createUIChangePR({
      title: command.slice(0, 50) + "...",
      description: `UI improvements requested: ${command}`,
      files
    });

    return {
      message: `🎨 UI Changes Ready!\n\n✅ Created PR: ${result.prUrl}\n\nFiles modified:\n${files.map(f => `• ${f.path}`).join('\n')}\n\n**Reply YES to merge** or view the PR first.`,
      pr_url: result.prUrl,
      pr_number: result.prNumber
    };

  } catch (error) {
    console.error("UI PR creation error:", error);
    return {
      message: `❌ Failed to create UI changes PR: ${error.message}\n\nGenerated changes:\n${files.map(f => `• ${f.path}: ${f.description}`).join('\n')}`
    };
  }
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

function parseUIChanges(aiResponse) {
  const files = [];
  const sections = aiResponse.split('---').filter(section => section.trim());
  
  for (const section of sections) {
    const lines = section.trim().split('\n');
    let filePath = '';
    let description = '';
    let content = '';
    let inContent = false;
    
    for (const line of lines) {
      if (line.startsWith('FILE:')) {
        filePath = line.replace('FILE:', '').trim();
      } else if (line.startsWith('DESCRIPTION:')) {
        description = line.replace('DESCRIPTION:', '').trim();
      } else if (line.startsWith('CONTENT:')) {
        inContent = true;
      } else if (inContent) {
        content += line + '\n';
      }
    }
    
    if (filePath && content.trim()) {
      files.push({
        path: filePath,
        description: description || `Update ${filePath}`,
        content: content.trim()
      });
    }
  }
  
  return files;
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
