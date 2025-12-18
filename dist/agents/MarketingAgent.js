import { BaseAgent } from './BaseAgent.js';
export class MarketingAgent extends BaseAgent {
    ads;
    constructor(db, eventBus, ads) {
        super('Marketer', db, eventBus);
        this.ads = ads;
        this.registerTool('create_ad_campaign', this.createAdCampaign.bind(this));
        this.registerTool('stop_campaign', this.stopCampaign.bind(this));
        this.registerTool('write_copy', this.writeCopy.bind(this));
        // Subscribe to Supplier Handoff
        // We listen for Supplier.Found (or Supplier.Approved if we had a CEO step in between)
        // For this phase, let's assume we go straight from Supplier Found -> Marketing (or Store -> Marketing)
        // The legacy flow was Store -> Marketing (PRODUCT_PAGE_CREATED).
        // The Registry has 'Store.PageCreated'.
        // Let's listen to 'Store.PageCreated' to maintain the logical flow: Research -> Supplier -> Store -> Marketing
        this.eventBus.subscribe('Store.PageCreated', 'MarketingAgent', async (event) => {
            this.log('info', `Received Page Created: ${event.payload.pageUrl}`);
            await this.create_ad_campaign(event.payload);
        });
    }
    async stopCampaign(args) {
        const { campaign_id } = args;
        this.log('info', `Stopping campaign ${campaign_id}`);
        try {
            await this.ads.stopCampaign(campaign_id);
            return { status: 'success', message: `Campaign ${campaign_id} stopped` };
        }
        catch (e) {
            this.log('error', `Failed to stop campaign: ${e.message}`);
            throw e;
        }
    }
    async create_ad_campaign(payload) {
        // Handle both direct tool calls (args) and event payloads
        const product = payload.product || payload;
        const productName = product.name || "Unknown Product";
        this.log('info', `Workflow: Creating ad campaign for ${productName}`);
        try {
            const campaign = await this.ads.createCampaign({
                product: productName,
                platform: 'Facebook', // Default for now
                budget: 500, // Default budget
                status: 'active'
            });
            this.log('info', `Campaign started: ${campaign.id}`);
            await this.eventBus.publish('Marketing.CampaignStarted', { campaign, product });
        }
        catch (error) {
            this.log('error', `Failed to create campaign: ${error.message}`);
        }
    }
    async createAdCampaign(args) {
        const { platform, budget, product } = args;
        // Use the injected adapter directly
        this.log('info', `Creating ${platform} campaign for ${product} with budget $${budget}`);
        const campaign = {
            platform: platform,
            product: product,
            budget: budget,
            status: 'draft'
        };
        this.log('info', `[DEBUG] Calling ads.createCampaign...`);
        const created = await this.ads.createCampaign(campaign);
        this.log('info', `[DEBUG] ads.createCampaign returned: ${created.id}`);
        return {
            campaign_id: created.id,
            status: created.status,
            estimated_reach: 50000
        };
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
