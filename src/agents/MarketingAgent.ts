import { BaseAgent } from './BaseAgent.js';
import { PersistencePort } from '../core/domain/ports/PersistencePort.js';
import { EventBusPort } from '../core/domain/ports/EventBusPort.js';
import { AdsPlatformPort } from '../core/domain/ports/AdsPlatformPort.js';
import { configService } from '../infra/config/ConfigService.js';
import { Campaign } from '../core/domain/types/Campaign.js';

export class MarketingAgent extends BaseAgent {
  private ads: AdsPlatformPort;

  constructor(db: PersistencePort, eventBus: EventBusPort, ads: AdsPlatformPort) {
    super('Marketer', db, eventBus);
    this.ads = ads;
    this.registerTool('create_ad_campaign', this.createAdCampaign.bind(this));
    this.registerTool('stop_campaign', this.stopCampaign.bind(this));
    this.registerTool('write_copy', this.writeCopy.bind(this));
  }

  async stopCampaign(args: { campaign_id: string }) {
      const { campaign_id } = args;
      this.log('info', `Stopping campaign ${campaign_id}`);
      try {
          await this.ads.stopCampaign(campaign_id);
          return { status: 'success', message: `Campaign ${campaign_id} stopped` };
      } catch (e: any) {
          this.log('error', `Failed to stop campaign: ${e.message}`);
          throw e;
      }
  }

  async create_ad_campaign(payload: any) {
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
      } catch (error: any) {
          this.log('error', `Failed to create campaign: ${error.message}`);
      }
  }

  async createAdCampaign(args: { platform: string, budget: number, product: string }) {
    const { platform, budget, product } = args;
    
    // Use the injected adapter directly
    this.log('info', `Creating ${platform} campaign for ${product} with budget $${budget}`);
    
    const campaign: Omit<Campaign, 'id'> = {
        platform: platform as any,
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

  async writeCopy(args: { type: string, topic: string }) {
    const { type, topic } = args;
    this.log('info', `Writing ${type} copy about ${topic}`);
    return {
      headline: `Discover the Amazing ${topic}`,
      body: `Don't miss out on this revolutionary ${topic}. Buy now!`
    };
  }
}
