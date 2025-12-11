export class MockAdsAdapter {
    campaigns = new Map();
    async createCampaign(campaignData) {
        console.log(`[MockAds] createCampaign called for ${campaignData.product}`);
        const id = `ad_camp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newCampaign = {
            ...campaignData,
            id,
            status: 'active', // Default to active for mock
            timestamp: new Date().toISOString()
        };
        this.campaigns.set(id, newCampaign);
        console.log(`[MockAds] Created campaign: ${newCampaign.product} on ${newCampaign.platform} (${id})`);
        return newCampaign;
    }
    async listCampaigns() {
        return Array.from(this.campaigns.values());
    }
    async stopCampaign(id) {
        const campaign = this.campaigns.get(id);
        if (campaign) {
            campaign.status = 'ended';
            this.campaigns.set(id, campaign);
            console.log(`[MockAds] Stopped campaign: ${id}`);
        }
    }
}
