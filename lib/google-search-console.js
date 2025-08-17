
// lib/google-search-console.js
import { google } from 'googleapis';

const GOOGLE_CREDENTIALS = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const SITE_URL = process.env.SITE_URL || 'https://your-site.vercel.app';

let searchConsole = null;

async function getSearchConsoleClient() {
  if (searchConsole) return searchConsole;

  if (!GOOGLE_CREDENTIALS) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set');
  }

  try {
    const credentials = JSON.parse(GOOGLE_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
    });

    searchConsole = google.searchconsole({ version: 'v1', auth });
    return searchConsole;
  } catch (error) {
    throw new Error(`Failed to initialize Search Console client: ${error.message}`);
  }
}

export async function getSearchQueries(days = 30) {
  try {
    const client = await getSearchConsoleClient();
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await client.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 50,
        startRow: 0
      }
    });

    return response.data.rows || [];
  } catch (error) {
    console.error('Search Console API error:', error);
    return [];
  }
}

export async function getTopPages(days = 30) {
  try {
    const client = await getSearchConsoleClient();
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await client.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 25,
        startRow: 0
      }
    });

    return response.data.rows || [];
  } catch (error) {
    console.error('Search Console pages API error:', error);
    return [];
  }
}

export async function getSearchConsoleInsights() {
  try {
    const [queries, pages] = await Promise.all([
      getSearchQueries(30),
      getTopPages(30)
    ]);

    const topQueries = queries
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10)
      .map(q => q.keys[0]);

    const topPages = pages
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10)
      .map(p => p.keys[0]);

    const lowCtrQueries = queries
      .filter(q => q.impressions > 100 && q.ctr < 0.02)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 5)
      .map(q => ({ query: q.keys[0], ctr: q.ctr, impressions: q.impressions }));

    return {
      top_queries: topQueries,
      top_pages: topPages,
      low_ctr_opportunities: lowCtrQueries,
      total_queries: queries.length,
      total_impressions: queries.reduce((sum, q) => sum + q.impressions, 0),
      total_clicks: queries.reduce((sum, q) => sum + q.clicks, 0)
    };
  } catch (error) {
    console.error('Search Console insights error:', error);
    return {
      top_queries: [],
      top_pages: [],
      low_ctr_opportunities: [],
      total_queries: 0,
      total_impressions: 0,
      total_clicks: 0
    };
  }
}
