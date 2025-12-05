import { AdsPlatformPort } from '../../core/domain/ports/AdsPlatformPort.js';
import { Campaign } from '../../core/domain/types/Campaign.js';

export class TestAdsAdapter implements AdsPlatformPort {
  async createCampaign(campaign: Omit<Campaign, 'id'>): Promise<Campaign> {
    console.log(`[TestAds] Creating campaign in SANDBOX environment for ${campaign.platform}`);
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      ...campaign,
      id: `sandbox_cmp_${Date.now()}`,
      status: 'active'
    };
  }

  async listCampaigns(): Promise<Campaign[]> {
    return [];
  }

  async stopCampaign(id: string): Promise<void> {
    console.log(`[TestAds] Stopping SANDBOX campaign ${id}`);
  }
}
