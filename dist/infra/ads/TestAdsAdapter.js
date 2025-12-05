export class TestAdsAdapter {
    async createCampaign(campaign) {
        console.log(`[TestAds] Creating campaign in SANDBOX environment for ${campaign.platform}`);
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            ...campaign,
            id: `sandbox_cmp_${Date.now()}`,
            status: 'active'
        };
    }
    async listCampaigns() {
        return [];
    }
    async stopCampaign(id) {
        console.log(`[TestAds] Stopping SANDBOX campaign ${id}`);
    }
}
