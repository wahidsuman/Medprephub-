
// pages/api/cron-daily.js
// Set this up as a Vercel Cron job to run daily at 9 AM

export default async function handler(req, res) {
  // Only allow cron or manual trigger
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const baseUrl = process.env.VERCEL_URL || 'http://localhost:3000';
    
    // Trigger daily analysis
    const analyzeRes = await fetch(`${baseUrl}/api/manager/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    if (!analyzeRes.ok) {
      throw new Error("Failed to run daily analysis");
    }

    // Trigger proposal generation
    const proposeRes = await fetch(`${baseUrl}/api/manager/propose`, {
      method: "GET"
    });

    if (!proposeRes.ok) {
      throw new Error("Failed to generate proposals");
    }

    return res.status(200).json({ 
      ok: true, 
      message: "Daily automation completed",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Daily cron error:", error);
    return res.status(500).json({ 
      ok: false, 
      error: error.message 
    });
  }
}
