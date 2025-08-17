
// pages/api/manager/analyze.js
import { askOpenAI } from "../../../lib/openai";
import { tgSend } from "../../../lib/telegram";
import { getSearchConsoleInsights } from "../../../lib/google-search-console";
import { getAnalyticsInsights } from "../../../lib/google-analytics";

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

// Real Google Search Console data
async function getSearchConsoleData() {
  try {
    const insights = await getSearchConsoleInsights();
    return {
      top_queries: insights.top_queries,
      top_pages: insights.top_pages,
      low_ctr_opportunities: insights.low_ctr_opportunities,
      total_impressions: insights.total_impressions,
      total_clicks: insights.total_clicks,
      avg_ctr: insights.total_impressions > 0 ? (insights.total_clicks / insights.total_impressions * 100).toFixed(2) : 0
    };
  } catch (error) {
    console.error("Search Console error:", error);
    // Fallback to mock data if API fails
    return {
      top_queries: ["neet pg preparation", "cardiology mcqs", "fmge exam"],
      top_pages: ["/posts/cardiology-for-neet-pg"],
      low_ctr_opportunities: [],
      total_impressions: 0,
      total_clicks: 0,
      avg_ctr: 0,
      error: "GSC API unavailable"
    };
  }
}

// Real Google Analytics data
async function getAnalyticsData() {
  try {
    const insights = await getAnalyticsInsights();
    return {
      top_pages: insights.top_pages,
      traffic_sources: insights.traffic_sources,
      total_sessions: insights.total_sessions,
      avg_engagement: insights.avg_engagement_rate,
      declining_pages: insights.declining_pages,
      growth_opportunities: insights.growth_opportunities
    };
  } catch (error) {
    console.error("Analytics error:", error);
    // Fallback to mock data if API fails
    return {
      top_pages: [],
      traffic_sources: [],
      total_sessions: 0,
      avg_engagement: 0,
      declining_pages: [],
      growth_opportunities: [],
      error: "GA4 API unavailable"
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    
    // Gather real intelligence
    const competitors = await analyzeCompetitors();
    const gscData = await getSearchConsoleData();
    const analyticsData = await getAnalyticsData();
    
    const analysisPrompt = `
You are an AI Website Manager for MedPrepHub (NEET PG/FMGE/INI-CET prep site).

TODAY'S INTELLIGENCE:
Date: ${today}

COMPETITOR ANALYSIS:
- Trending: ${competitors.trending_topics.join(", ")}
- Content gaps: ${competitors.content_gaps.join(", ")}
- SEO opportunities: ${competitors.seo_opportunities.join(", ")}

GOOGLE SEARCH CONSOLE DATA:
- Top queries: ${gscData.top_queries.join(", ")}
- Top pages: ${gscData.top_pages.join(", ")}
- Total impressions: ${gscData.total_impressions}
- Total clicks: ${gscData.total_clicks}
- Average CTR: ${gscData.avg_ctr}%
- Low CTR opportunities: ${gscData.low_ctr_opportunities.map(q => q.query).join(", ")}
${gscData.error ? `- API Status: ${gscData.error}` : ''}

GOOGLE ANALYTICS DATA:
- Total sessions: ${analyticsData.total_sessions}
- Average engagement: ${(analyticsData.avg_engagement * 100).toFixed(1)}%
- Top traffic sources: ${analyticsData.traffic_sources.map(s => s.source).join(", ")}
- Declining pages: ${analyticsData.declining_pages.map(p => p.path).join(", ")}
- Growth opportunities: ${analyticsData.growth_opportunities.map(p => p.path).join(", ")}
${analyticsData.error ? `- API Status: ${analyticsData.error}` : ''}

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
