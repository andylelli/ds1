import { Campaign } from '../types/index.js';

export interface AdsPlatformPort {
  createCampaign(campaign: Omit<Campaign, 'id'>): Promise<Campaign>;
  listCampaigns(): Promise<Campaign[]>;
  stopCampaign(id: string): Promise<void>;
}
