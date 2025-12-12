import { AdsPlatformPort } from '../../core/domain/ports/AdsPlatformPort.js';
import { Campaign } from '../../core/domain/types/Campaign.js';
import { ActivityLogService } from '../../core/services/ActivityLogService.js';
import { Pool } from 'pg';

export class LiveAdsAdapter implements AdsPlatformPort {
  private activityLog: ActivityLogService | null = null;

  constructor(pool?: Pool) {
    if (pool) {
      this.activityLog = new ActivityLogService(pool);
    }
  }

  private async logError(action: string, error: any, details: any = {}) {
    console.error(`[LiveAds] ${action} failed:`, error.message);
    if (this.activityLog) {
      await this.activityLog.log({
        agent: 'MarketingAgent', // Or 'AdsAdapter'
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

  async createCampaign(campaign: Omit<Campaign, 'id'>): Promise<Campaign> {
    console.log(`[LiveAds] 🔴 WARNING: Creating REAL campaign on ${campaign.platform} with budget $${campaign.budget}`);
    try {
        // In a real app, this would call Facebook/TikTok Marketing APIs
        throw new Error("Live Ads API keys not configured. Safety block active.");
    } catch (e: any) {
        await this.logError('create_campaign', e, { campaign });
        throw e;
    }
  }

  async listCampaigns(): Promise<Campaign[]> {
    try {
        throw new Error("Live Ads API keys not configured.");
    } catch (e: any) {
        await this.logError('list_campaigns', e);
        throw e;
    }
  }

  async stopCampaign(id: string): Promise<void> {
    try {
        throw new Error("Live Ads API keys not configured.");
    } catch (e: any) {
        await this.logError('stop_campaign', e, { id });
        throw e;
    }
  }
}
