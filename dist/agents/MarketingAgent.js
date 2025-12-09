import { BaseAgent } from './BaseAgent.js';
import { configService } from '../infra/config/ConfigService.js';
export class MarketingAgent extends BaseAgent {
    ads;
    constructor(db, ads) {
        super('Marketer', db);
        this.ads = ads;
        this.registerTool('create_ad_campaign', this.createAdCampaign.bind(this));
        this.registerTool('write_copy', this.writeCopy.bind(this));
    }
    async createAdCampaign(args) {
        const { platform, budget, product } = args;
        if (configService.get('useSimulatedEndpoints')) {
            return this._createAdCampaignMock(platform, budget, product);
        }
        else {
            return this._createAdCampaignReal(platform, budget, product);
        }
    }
    async _createAdCampaignMock(platform, budget, product) {
        this.log('info', `Creating ${platform} campaign for ${product} with budget $${budget}`);
        const campaign = {
            platform: platform,
            product: product,
            budget: budget,
            status: 'draft'
        };
        const created = await this.ads.createCampaign(campaign);
        return {
            campaign_id: created.id,
            status: created.status,
            estimated_reach: 50000
        };
    }
    async _createAdCampaignReal(platform, budget, product) {
        this.log('info', `[REAL] Creating ${platform} campaign via API`);
        // In a real scenario, we would use a RealAdsAdapter here
        // For now, we throw as per original logic
        throw new Error(`Real Marketing API for ${platform} not implemented yet. Switch to mock mode.`);
    }
    async writeCopy(args) {
        const { type, topic } = args;
        this.log('info', `Writing ${type} copy about ${topic}`);
        return {
            headline: `Discover the Amazing ${topic}`,
            body: `Don't miss out on this revolutionary ${topic}. Buy now!`
        };
    }
}
