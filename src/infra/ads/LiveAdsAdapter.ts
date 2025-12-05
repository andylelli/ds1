import { AdsPlatformPort } from '../../core/domain/ports/AdsPlatformPort.js';
import { Campaign } from '../../core/domain/types/Campaign.js';

export class LiveAdsAdapter implements AdsPlatformPort {
  async createCampaign(campaign: Omit<Campaign, 'id'>): Promise<Campaign> {
    console.log(`[LiveAds] 🔴 WARNING: Creating REAL campaign on ${campaign.platform} with budget $${campaign.budget}`);
    // In a real app, this would call Facebook/TikTok Marketing APIs
    throw new Error("Live Ads API keys not configured. Safety block active.");
  }

  async listCampaigns(): Promise<Campaign[]> {
    throw new Error("Live Ads API keys not configured.");
  }

  async stopCampaign(id: string): Promise<void> {
    throw new Error("Live Ads API keys not configured.");
  }
}
