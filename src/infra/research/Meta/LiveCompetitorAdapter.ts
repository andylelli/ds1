import { CompetitorAnalysisPort } from '../../../core/domain/ports/CompetitorAnalysisPort.js';
import axios from 'axios';
import { logger } from '../../logging/LoggerService.js';
import { ActivityLogService } from '../../../core/services/ActivityLogService.js';
import { Pool } from 'pg';

export class LiveCompetitorAdapter implements CompetitorAnalysisPort {
  private serpApiKey: string | undefined;
  private metaAccessToken: string | undefined;
  private activityLog: ActivityLogService | null = null;

  constructor(pool?: Pool) {
    this.serpApiKey = process.env.SERPAPI_KEY;
    this.metaAccessToken = process.env.META_ACCESS_TOKEN;
    if (pool) {
        this.activityLog = new ActivityLogService(pool);
    }
  }

  async analyzeCompetitors(category: string): Promise<any> {
    if (!this.serpApiKey) {
      console.warn('[LiveCompetitorAdapter] SERPAPI_KEY not set. Returning stub data.');
      if (this.activityLog) {
          await this.activityLog.log({
              agent: 'ProductResearcher',
              action: 'analyze_competitors',
              category: 'research',
              status: 'warning',
              message: 'SERPAPI_KEY missing. Returning stub data.',
              details: { category }
          });
      }
      return { 
          competitors: [], 
          saturation_score: 0, 
          note: "Missing SERPAPI_KEY. Please set this environment variable to enable live competitor analysis." 
      };
    }

    const query = `best ${category} store -amazon -ebay -walmart -target -etsy`;
    let response, results, competitors, saturationScore;
    try {
      logger.external('CompetitorAnalysis', 'SERPAPI', { 
          endpoint: 'https://serpapi.com/search.json', 
          summary: `Analyzing competitors for: ${category}`,
          status: 'started',
          params: { engine: 'google', q: query, api_key: '***', num: 10, gl: 'us', hl: 'en' } 
      });
      response = await axios.get('https://serpapi.com/search.json', {
        params: {
          engine: 'google',
          q: query,
          api_key: this.serpApiKey,
          num: 10,
          gl: 'us',
          hl: 'en'
        }
      });
      results = response.data.organic_results || [];
      competitors = results.map((r: any) => ({
        name: r.title,
        url: r.link,
        snippet: r.snippet,
        position: r.position
      }));
      saturationScore = Math.min(competitors.length / 10, 1.0);
      logger.external('CompetitorAnalysis', 'SERPAPI', { 
          endpoint: 'https://serpapi.com/search.json', 
          summary: `Found ${competitors.length} competitors`,
          status: 'success',
          data: {
              query, 
              competitorsCount: competitors.length, 
              saturationScore,
              topCompetitors: competitors.slice(0, 3).map((c: any) => c.name)
          }
      });
      if (this.activityLog) {
        await this.activityLog.log({
            agent: 'CompetitorAdapter',
            action: 'analyze_competitors',
            category: 'research',
            status: 'completed',
            message: `Found ${competitors.length} competitors for ${category}`,
            details: { query, saturationScore, topCompetitors: competitors.slice(0, 3).map((c: any) => c.name) }
        });
      }
      return {
        competitors,
        saturation_score: saturationScore,
        source: 'serpapi',
        query_used: query
      };
    } catch (error: any) {
      logger.external('CompetitorAnalysis', 'SERPAPI', { endpoint: 'https://serpapi.com/search.json', query, error: error.message });
      console.error('[LiveCompetitorAdapter] SERP Search failed:', error.message);
      if (this.activityLog) {
        await this.activityLog.log({
            agent: 'CompetitorAdapter',
            action: 'analyze_competitors',
            category: 'research',
            status: 'failed',
            message: `SERP Search failed for ${category}`,
            details: { error: error.message }
        });
      }
      return { error: error.message, competitors: [] };
    }
  }

  async getCompetitorAds(competitorUrl: string): Promise<any[]> {
    if (!this.metaAccessToken) {
      console.warn('[LiveCompetitorAdapter] META_ACCESS_TOKEN not set. Returning empty list.');
      return [];
    }

    // Extract brand name from URL for search
    // e.g., https://www.gymshark.com -> gymshark
    let brand = '';
    try {
        // Handle cases where competitorUrl might not be a full URL
        const urlStr = competitorUrl.startsWith('http') ? competitorUrl : `https://${competitorUrl}`;
        const urlObj = new URL(urlStr);
        const parts = urlObj.hostname.split('.');
        // Heuristic: take the part before the TLD (e.g., 'gymshark' from 'gymshark.com' or 'www.gymshark.com')
        brand = parts.length > 2 ? parts[parts.length - 2] : parts[0];
    } catch (e) {
        brand = competitorUrl; // Fallback to using the string as-is
    }

    let response;
    try {
      logger.external('CompetitorAnalysis', 'MetaAdsAPI', { 
          endpoint: 'https://graph.facebook.com/v19.0/ads_archive', 
          summary: `Checking ads for brand: ${brand}`,
          status: 'started',
          params: { search_terms: brand, ad_active_status: 'ACTIVE', ad_reached_countries: '["US"]' } 
      });
      response = await axios.get('https://graph.facebook.com/v19.0/ads_archive', {
        params: {
          access_token: this.metaAccessToken,
          search_terms: brand,
          ad_active_status: 'ACTIVE',
          ad_reached_countries: '["US"]',
          ad_type: 'ALL',
          limit: 5,
          fields: 'id,ad_creation_time,ad_creative_bodies,ad_creative_link_captions,publisher_platforms'
        }
      });
      logger.external('CompetitorAnalysis', 'MetaAdsAPI', { 
          endpoint: 'https://graph.facebook.com/v19.0/ads_archive', 
          summary: `Found ${response.data.data?.length || 0} ads for ${brand}`,
          status: 'success',
          data: {
              brand, 
              adsCount: response.data.data?.length || 0, 
              ads: response.data.data 
          }
      });
      if (this.activityLog) {
        await this.activityLog.log({
            agent: 'CompetitorAdapter',
            action: 'get_competitor_ads',
            category: 'research',
            status: 'completed',
            message: `Found ${response.data.data?.length || 0} ads for ${brand}`,
            details: { brand, adsCount: response.data.data?.length || 0 }
        });
      }
      return response.data.data || [];
    } catch (error: any) {
      const errorData = error.response?.data?.error || {};
      logger.external('CompetitorAnalysis', 'MetaAdsAPI', { endpoint: 'https://graph.facebook.com/v19.0/ads_archive', brand, error: errorData.message || error.message });
      console.error('[LiveCompetitorAdapter] Meta Ads check failed:', errorData.message || error.message);
      if (this.activityLog) {
        await this.activityLog.log({
            agent: 'CompetitorAdapter',
            action: 'get_competitor_ads',
            category: 'research',
            status: 'failed',
            message: `Meta Ads check failed for ${brand}`,
            details: { error: errorData.message || error.message }
        });
      }
      if (errorData.code === 1) {
          console.warn('[LiveCompetitorAdapter] Hint: "Unknown error" (Code 1) often means the App is in Development Mode and lacks "Advanced Access" to query public ads. Switch App to Live Mode or verify Business Manager.');
      }
      return [];
    }
  }
}
