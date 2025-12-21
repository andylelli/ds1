import { AdsPlatformPort } from '../../../core/domain/ports/AdsPlatformPort.js';
import { Campaign } from '../../../core/domain/types/Campaign.js';
import { ActivityLogService } from '../../../core/services/ActivityLogService.js';
import { logger } from '../../logging/LoggerService.js';
import { Pool } from 'pg';
import { GoogleAdsApi, enums } from 'google-ads-api';

export class LiveAdsAdapter implements AdsPlatformPort {
  private activityLog: ActivityLogService | null = null;
  private client: GoogleAdsApi | null = null;
  private customerId: string | undefined;

  constructor(pool?: Pool) {
    if (pool) {
      this.activityLog = new ActivityLogService(pool);
    }
    this.initializeClient();
  }

  private initializeClient() {
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
    this.customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;

    if (clientId && clientSecret && developerToken && refreshToken) {
      this.client = new GoogleAdsApi({
        client_id: clientId,
        client_secret: clientSecret,
        developer_token: developerToken,
      });
    } else {
      console.warn('[LiveAds] Google Ads credentials missing. Adapter will fail if used.');
    }
  }

  private async logError(action: string, error: any, details: any = {}) {
    console.error(`[LiveAds] ${action} failed:`, error.message);
    if (this.activityLog) {
      await this.activityLog.log({
        agent: 'MarketingAgent',
        action: action,
        category: 'marketing',
        status: 'failed',
        message: `Ads Adapter ${action} failed`,
        details: { 
          error: error.message, 
          stack: error.stack, 
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
          ...details
        }
      }).catch(e => console.error('Failed to log Ads error to DB:', e));
    }
  }

  private async getCustomer() {
    if (!this.client || !this.customerId) {
      throw new Error("Google Ads Client not initialized or Customer ID missing.");
    }
    return this.client.Customer({
      customer_id: this.customerId,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    });
  }

  async createCampaign(campaign: Omit<Campaign, 'id'>): Promise<Campaign> {
    console.log(`[LiveAds] Creating campaign on ${campaign.platform} with budget $${campaign.budget}`);
    
    if (campaign.platform !== 'Google') {
        throw new Error(`LiveAdsAdapter currently only supports Google Ads. Requested: ${campaign.platform}`);
    }

    try {
        const customer = await this.getCustomer();
        
        // 1. Create Budget
        const budgetRes = await customer.campaignBudgets.create({
            amount_micros: campaign.budget * 1000000, // Convert to micros
            delivery_method: enums.BudgetDeliveryMethod.STANDARD,
            explicitly_shared: false,
        });
        const budgetResourceName = budgetRes.results[0].resource_name;

        // 2. Create Campaign
        const campaignRes = await customer.campaigns.create({
            name: `${campaign.product} - ${new Date().toISOString()}`,
            campaign_budget: budgetResourceName,
            advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
            status: enums.CampaignStatus.PAUSED, // Always create paused for safety
            network_settings: {
                target_google_search: true,
                target_search_network: true,
                target_content_network: false,
                target_partner_search_network: false,
            },
            start_date: new Date().toISOString().split('T')[0].replace(/-/g, ''),
        });

        const campaignId = campaignRes.results[0].resource_name;
        logger.external('GoogleAds', 'createCampaign', { campaignId, budget: campaign.budget });

        return {
            ...campaign,
            id: campaignId,
            status: 'paused', // Created as paused
            timestamp: new Date().toISOString(),
            _db: 'live'
        };

    } catch (e: any) {
        await this.logError('create_campaign', e, { campaign });
        throw e;
    }
  }

  async listCampaigns(): Promise<Campaign[]> {
    try {
        const customer = await this.getCustomer();
        const campaigns = await customer.query(`
            SELECT 
                campaign.id, 
                campaign.name, 
                campaign.status, 
                campaign_budget.amount_micros 
            FROM campaign 
            WHERE campaign.status != 'REMOVED'
            LIMIT 50
        `);

        return campaigns.map((row: any) => ({
            id: row.campaign.resource_name,
            platform: 'Google',
            product: row.campaign.name, // Assuming name contains product info
            budget: (row.campaign_budget.amount_micros || 0) / 1000000,
            status: row.campaign.status === enums.CampaignStatus.ENABLED ? 'active' : 'paused',
            timestamp: new Date().toISOString(),
            _db: 'live'
        }));

    } catch (e: any) {
        await this.logError('list_campaigns', e);
        throw e;
    }
  }

  async stopCampaign(id: string): Promise<void> {
      try {
        const customer = await this.getCustomer();
        await customer.campaigns.update({
            resource_name: id,
            status: enums.CampaignStatus.PAUSED
        });
        logger.external('GoogleAds', 'stopCampaign', { id });
      } catch (e: any) {
          await this.logError('stop_campaign', e, { id });
          throw e;
      }
  }

  async getKeywordMetrics(keywords: string[]): Promise<any> {
    try {
        const customer = await this.getCustomer();
        
        // Use the KeywordPlanIdeaService to get historical metrics
        // Note: This requires the 'generateKeywordHistoricalMetrics' method
        const response = await customer.keywordPlanIdeas.generateKeywordHistoricalMetrics({
            customer_id: this.customerId!,
            keywords: keywords,
            geo_target_constants: ['geoTargetConstants/2840'], // US
            keyword_plan_network: enums.KeywordPlanNetwork.GOOGLE_SEARCH,
            language: 'languageConstants/1000', // English
        });

        // Map the results to a cleaner format
        const results = response.results || [];
        return results.map((row: any) => ({
            text: row.text,
            avgMonthlySearches: row.keyword_metrics.avg_monthly_searches,
            competition: row.keyword_metrics.competition, // LOW, MEDIUM, HIGH
            competitionIndex: row.keyword_metrics.competition_index, // 0-100
            lowTopOfPageBid: (row.keyword_metrics.low_top_of_page_bid_micros || 0) / 1000000,
            highTopOfPageBid: (row.keyword_metrics.high_top_of_page_bid_micros || 0) / 1000000,
        }));

    } catch (e: any) {
        // Handle specific API permission errors
        if (e.errors && e.errors[0]?.error_code?.authorization_error === 'DEVELOPER_TOKEN_NOT_APPROVED') {
            console.warn('[LiveAds] Warning: Developer Token not approved for Keyword Planning API. Returning stub data.');
            return keywords.map(k => ({
                text: k,
                avgMonthlySearches: 0,
                competition: 'UNKNOWN',
                note: 'Requires Basic Access'
            }));
        }

        console.error('[LiveAds] Raw Error:', JSON.stringify(e, null, 2));
        await this.logError('getKeywordMetrics', e, { keywords });
        throw e;
    }
  }
}
