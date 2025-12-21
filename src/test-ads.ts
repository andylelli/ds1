
import { LiveAdsAdapter } from './infra/ads/LiveAdsAdapter.js';
import { MockAdapter } from './infra/db/MockAdapter.js';
import dotenv from 'dotenv';

dotenv.config();

async function testAdsAdapter() {
    console.log('--- Testing Live Ads Adapter ---');
    
    // Mock Pool for logging
    const mockPool = {
        query: async (text: string, params: any[]) => {
            console.log(`[MockDB] Query: ${text}`);
            return { rows: [] };
        },
        connect: async () => ({ 
            query: async () => ({ rows: [] }),
            release: () => {} 
        }),
        on: () => {}
    } as any;

    const ads = new LiveAdsAdapter(mockPool);

    try {
        console.log('1. Listing Campaigns...');
        const campaigns = await ads.listCampaigns();
        console.log(`Found ${campaigns.length} campaigns.`);
        campaigns.forEach(c => console.log(`- ${c.product} (${c.status})`));

    } catch (error: any) {
        console.error('Test Failed:', error.message);
        if (error.message.includes('Client secret')) {
            console.log('✅ Expected failure: Client Secret is missing in .env');
        } else if (error.message.includes('invalid_grant')) {
             console.log('❌ Auth Error: Refresh Token or Client ID/Secret is invalid.');
        } else if (error.message.includes('unauthorized_client')) {
             console.log('❌ Auth Error: Client is unauthorized. Check Client ID/Secret match.');
        }
    }
}

testAdsAdapter();
