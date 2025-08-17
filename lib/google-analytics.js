
// lib/google-analytics.js
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const GOOGLE_CREDENTIALS = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;

let analyticsClient = null;

async function getAnalyticsClient() {
  if (analyticsClient) return analyticsClient;

  if (!GOOGLE_CREDENTIALS) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set');
  }

  if (!GA4_PROPERTY_ID) {
    throw new Error('GA4_PROPERTY_ID environment variable not set');
  }

  try {
    const credentials = JSON.parse(GOOGLE_CREDENTIALS);
    analyticsClient = new BetaAnalyticsDataClient({
      credentials
    });
    return analyticsClient;
  } catch (error) {
    throw new Error(`Failed to initialize Analytics client: ${error.message}`);
  }
}

export async function getTopPages(days = 30) {
  try {
    const client = await getAnalyticsClient();
    
    const [response] = await client.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      dateRanges: [
        {
          startDate: `${days}daysAgo`,
          endDate: 'today',
        },
      ],
      dimensions: [
        { name: 'pagePath' },
        { name: 'pageTitle' }
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'engagementRate' }
      ],
      orderBys: [
        {
          metric: { metricName: 'screenPageViews' },
          desc: true
        }
      ],
      limit: 20
    });

    return response.rows?.map(row => ({
      path: row.dimensionValues[0].value,
      title: row.dimensionValues[1].value,
      pageViews: parseInt(row.metricValues[0].value),
      sessions: parseInt(row.metricValues[1].value),
      engagementRate: parseFloat(row.metricValues[2].value)
    })) || [];

  } catch (error) {
    console.error('Analytics API error:', error);
    return [];
  }
}

export async function getTrafficSources(days = 30) {
  try {
    const client = await getAnalyticsClient();
    
    const [response] = await client.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      dateRanges: [
        {
          startDate: `${days}daysAgo`,
          endDate: 'today',
        },
      ],
      dimensions: [
        { name: 'sessionSourceMedium' }
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'newUsers' }
      ],
      orderBys: [
        {
          metric: { metricName: 'sessions' },
          desc: true
        }
      ],
      limit: 10
    });

    return response.rows?.map(row => ({
      source: row.dimensionValues[0].value,
      sessions: parseInt(row.metricValues[0].value),
      newUsers: parseInt(row.metricValues[1].value)
    })) || [];

  } catch (error) {
    console.error('Analytics traffic sources error:', error);
    return [];
  }
}

export async function getAnalyticsInsights() {
  try {
    const [topPages, trafficSources] = await Promise.all([
      getTopPages(30),
      getTrafficSources(30)
    ]);

    const totalPageViews = topPages.reduce((sum, page) => sum + page.pageViews, 0);
    const totalSessions = trafficSources.reduce((sum, source) => sum + source.sessions, 0);
    const avgEngagement = topPages.length > 0 
      ? topPages.reduce((sum, page) => sum + page.engagementRate, 0) / topPages.length 
      : 0;

    return {
      top_pages: topPages.slice(0, 10),
      traffic_sources: trafficSources,
      total_page_views: totalPageViews,
      total_sessions: totalSessions,
      avg_engagement_rate: avgEngagement,
      declining_pages: topPages.filter(page => page.engagementRate < 0.4),
      growth_opportunities: topPages.filter(page => page.sessions > 10 && page.engagementRate > 0.6)
    };
  } catch (error) {
    console.error('Analytics insights error:', error);
    return {
      top_pages: [],
      traffic_sources: [],
      total_page_views: 0,
      total_sessions: 0,
      avg_engagement_rate: 0,
      declining_pages: [],
      growth_opportunities: []
    };
  }
}
