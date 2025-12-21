import { AdsPlatformPort } from '../../../core/domain/ports/AdsPlatformPort.js';
import { Campaign } from '../../../core/domain/types/Campaign.js';

export class MockAdsAdapter implements AdsPlatformPort {
  private campaigns: Map<string, Campaign> = new Map();

  async createCampaign(campaignData: Omit<Campaign, 'id'>): Promise<Campaign> {
    console.log(`[MockAds] createCampaign called for ${campaignData.product}`);
    const id = `ad_camp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newCampaign: Campaign = {
      ...campaignData,
      id,
      status: 'active', // Default to active for mock
      timestamp: new Date().toISOString()
    };
    this.campaigns.set(id, newCampaign);
    console.log(`[MockAds] Created campaign: ${newCampaign.product} on ${newCampaign.platform} (${id})`);
    return newCampaign;
  }

  async listCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values());
  }

  async stopCampaign(id: string): Promise<void> {
    const campaign = this.campaigns.get(id);
    if (campaign) {
      campaign.status = 'ended';
      this.campaigns.set(id, campaign);
      console.log(`[MockAds] Stopped campaign: ${id}`);
    }
  }

  async getKeywordMetrics(keywords: string[]): Promise<any> {
    console.log(`[MockAds] getKeywordMetrics for: ${keywords.join(', ')}`);
    return keywords.map(k => ({
      keyword: k,
      avgMonthlySearches: Math.floor(Math.random() * 10000),
      competition: 'MEDIUM',
      cpc: (Math.random() * 2).toFixed(2)
    }));
  }
}
