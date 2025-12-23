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
    async getKeywordMetrics(keywords) {
        console.log(`[MockAds] getKeywordMetrics for: ${keywords.join(', ')}`);
        return keywords.map(k => ({
            keyword: k,
            avgMonthlySearches: Math.floor(Math.random() * 10000),
            competition: 'MEDIUM',
            cpc: (Math.random() * 2).toFixed(2)
        }));
    }
}
