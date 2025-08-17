
// pages/api/manager/analyze.js
import { askOpenAI } from "../../../lib/openai";
import { tgSend } from "../../../lib/telegram";

const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Mock competitor analysis (you can integrate real scraping later)
async function analyzeCompetitors() {
  const competitors = [
    "prepladder.com",
    "marrow.ai", 
    "dams.ac.in",
    "aiimsdelhi.edu.in"
  ];
  
  // In production, this would scrape competitor content/keywords
  return {
    trending_topics: ["Cardiology MCQs", "Pharmacology updates", "NEET PG 2024 pattern"],
    content_gaps: ["Radiology case studies", "Quick revision notes", "Mock test series"],
    seo_opportunities: ["neet pg cardiology mcqs", "fmge preparation tips", "ini cet syllabus"]
  };
}

// Mock GSC data (integrate real Google Search Console API later)
async function getSearchConsoleData() {
  return {
    top_queries: ["neet pg preparation", "cardiology mcqs", "fmge exam"],
    declining_pages: ["/posts/old-cardiology"],
    opportunity_keywords: ["neet pg cardiology notes", "fmge mock test"]
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    
    // Gather intelligence
    const competitors = await analyzeCompetitors();
    const gscData = await getSearchConsoleData();
    
    const analysisPrompt = `
You are an AI Website Manager for MedPrepHub (NEET PG/FMGE/INI-CET prep site).

TODAY'S INTELLIGENCE:
Date: ${today}

COMPETITOR ANALYSIS:
- Trending: ${competitors.trending_topics.join(", ")}
- Content gaps: ${competitors.content_gaps.join(", ")}
- SEO opportunities: ${competitors.seo_opportunities.join(", ")}

SEARCH CONSOLE DATA:
- Top queries: ${gscData.top_queries.join(", ")}
- Declining pages: ${gscData.declining_pages.join(", ")}
- Keyword opportunities: ${gscData.opportunity_keywords.join(", ")}

PROVIDE COMPREHENSIVE ANALYSIS:

📊 **DAILY INTELLIGENCE REPORT**
Date: ${today}

**🔍 COMPETITOR INSIGHTS:**
- [What competitors are doing well that we should adopt]
- [Content gaps we can fill immediately]

**📈 SEO OPPORTUNITIES:**
- [3 specific keyword targets for new content]
- [2 existing pages that need optimization]

**💡 CONTENT RECOMMENDATIONS:**
1. [High-impact post idea with title]
2. [Quick win content update]

**🎨 UI/UX SUGGESTIONS:**
- [One specific improvement for better user engagement]

**⚡ IMMEDIATE ACTIONS:**
- [Top priority task for today]

Do you want me to proceed with any of these recommendations? Reply YES + number (e.g., "YES 1,3") or ask for more details.
`;

    const analysis = await askOpenAI({
      system: "You are a data-driven website manager. Provide actionable, specific recommendations.",
      user: analysisPrompt,
      max_tokens: 1200,
      temperature: 0.3
    });

    // Send to Telegram
    if (CHAT_ID) {
      await tgSend(CHAT_ID, analysis);
    }

    return res.status(200).json({ ok: true, analysis });
  } catch (error) {
    console.error("Analysis error:", error);
    return res.status(500).json({ error: error.message });
  }
}
