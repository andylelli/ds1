import { logger } from '../logging/LoggerService.js';
import axios from 'axios';
export class LiveCompetitorAdapter {
    serpApiKey;
    metaAccessToken;
    constructor() {
        this.serpApiKey = process.env.SERPAPI_KEY;
        this.metaAccessToken = process.env.META_ACCESS_TOKEN;
    }
    async analyzeCompetitors(category) {
        if (!this.serpApiKey) {
            console.warn('[LiveCompetitorAdapter] SERPAPI_KEY not set. Returning stub data.');
            return {
                competitors: [],
                saturation_score: 0,
                note: "Missing SERPAPI_KEY. Please set this environment variable to enable live competitor analysis."
            };
        }
        try {
            console.log(`[LiveCompetitorAdapter] Searching for competitors in: ${category}`);
            // Search for independent stores, excluding major marketplaces
            const query = `best ${category} store -amazon -ebay -walmart -target -etsy`;
            const response = await axios.get('https://serpapi.com/search.json', {
                params: {
                    engine: 'google',
                    q: query,
                    api_key: this.serpApiKey,
                    num: 10,
                    gl: 'us', // Geo-location: US
                    hl: 'en' // Language: English
                }
            });
            const results = response.data.organic_results || [];
            // Map results to a cleaner format
            const competitors = results.map((r) => ({
                name: r.title,
                url: r.link,
                snippet: r.snippet,
                position: r.position
            }));
            // Simple saturation logic: If we find many relevant results, saturation is higher
            const saturationScore = Math.min(competitors.length / 10, 1.0);
            return {
                competitors,
                saturation_score: saturationScore,
                source: 'serpapi',
                query_used: query
            };
        }
        catch (error) {
            console.error('[LiveCompetitorAdapter] SERP Search failed:', error.message);
            return { error: error.message, competitors: [] };
        }
    }
    async getCompetitorAds(competitorUrl) {
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
        }
        catch (e) {
            brand = competitorUrl; // Fallback to using the string as-is
        }
        try {
            console.log(`[LiveCompetitorAdapter] Checking Meta Ads for brand: ${brand}`);
            // Meta Marketing API - Ads Archive
            // Docs: https://developers.facebook.com/docs/marketing-api/reference/ads_archive/
            const response = await axios.get('https://graph.facebook.com/v19.0/ads_archive', {
                params: {
                    access_token: this.metaAccessToken,
                    search_terms: brand,
                    ad_active_status: 'ACTIVE',
                    ad_reached_countries: '["US"]',
                    limit: 5,
                    fields: 'id,ad_creation_time,ad_creative_bodies,ad_creative_link_captions,publisher_platforms'
                }
            });
            return response.data.data || [];
        }
        catch (error) {
            logger.external('MetaAds', 'search', { brand, error: error.message });
            console.error('[LiveCompetitorAdapter] Meta Ads Search failed:', error.message);
            return [];
        }
    }
}
