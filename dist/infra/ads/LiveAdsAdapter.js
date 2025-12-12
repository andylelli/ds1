import { ActivityLogService } from '../../core/services/ActivityLogService.js';
export class LiveAdsAdapter {
    activityLog = null;
    constructor(pool) {
        if (pool) {
            this.activityLog = new ActivityLogService(pool);
        }
    }
    async logError(action, error, details = {}) {
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
    async createCampaign(campaign) {
        console.log(`[LiveAds] 🔴 WARNING: Creating REAL campaign on ${campaign.platform} with budget $${campaign.budget}`);
        try {
            // In a real app, this would call Facebook/TikTok Marketing APIs
            throw new Error("Live Ads API keys not configured. Safety block active.");
        }
        catch (e) {
            await this.logError('create_campaign', e, { campaign });
            throw e;
        }
    }
    async listCampaigns() {
        try {
            throw new Error("Live Ads API keys not configured.");
        }
        catch (e) {
            await this.logError('list_campaigns', e);
            throw e;
        }
    }
    async stopCampaign(id) {
        try {
            throw new Error("Live Ads API keys not configured.");
        }
        catch (e) {
            await this.logError('stop_campaign', e, { id });
            throw e;
        }
    }
}
