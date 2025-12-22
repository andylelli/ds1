
import dotenv from 'dotenv';
dotenv.config(); // Load env vars FIRST

import { PostgresEventBus } from './infra/events/PostgresEventBus.js';
import { MockAdapter } from './infra/db/MockAdapter.js';
import { ProductResearchAgent } from './agents/ProductResearchAgent.js';
import { LiveTrendAdapter } from './infra/trends/GoogleTrendsAPI/LiveTrendAdapter.js';
import { LiveAdsAdapter } from './infra/ads/GoogleAds/LiveAdsAdapter.js';
import { MockCompetitorAdapter } from './infra/research/MockCompetitorAdapter.js';
import { Pool } from 'pg';

// Mock Pool
const mockPool = {
  query: async (text: string, params: any[]) => {
    // console.log(`[MockDB] Query: ${text}`); // Silence DB logs
    return { rows: [] };
  },
  connect: async () => ({ 
    query: async () => ({ rows: [] }),
    release: () => {} 
  }),
  on: () => {}
} as unknown as Pool;

async function testFullResearch() {
    console.log('--- Starting FULL Research Vertical Test ---');
    console.log('Modes: Trends=LIVE, Ads=LIVE, AI=LIVE');

    // 1. Infrastructure
    const db = new MockAdapter();
    const eventBus = new PostgresEventBus(db);
    
    // Disable staging for tests to avoid DB errors with mockPool
    const trendAnalyzer = new (await import('./infra/trends/GoogleTrendsAPI/LiveTrendAdapter.js')).LiveTrendAdapter(mockPool, false);
    const adsAdapter = new (await import('./infra/ads/GoogleAds/LiveAdsAdapter.js')).LiveAdsAdapter(mockPool);
    const competitorAnalyzer = new (await import('./infra/research/Meta/LiveCompetitorAdapter.js')).LiveCompetitorAdapter(mockPool);
    const shopCompliance = new (await import('./infra/shop/Shopify/LiveShopAdapter.js')).LiveShopAdapter(mockPool);
    const videoAnalyzer = new (await import('./infra/research/YouTube/LiveVideoAdapter.js')).LiveVideoAdapter(mockPool);

    const researcher = new ProductResearchAgent(
        db,
        eventBus,
        trendAnalyzer,
        competitorAnalyzer,
        adsAdapter,
        shopCompliance,
        videoAnalyzer
    );

    // 3. Observer
    eventBus.subscribe('OpportunityResearch.BriefCreated', 'Observer', async (event) => {
        console.log(`[👀 OBSERVER] Brief Created: ${event.payload.brief_id}`);
    });

    eventBus.subscribe('OpportunityResearch.SignalsCollected', 'Observer', async (event) => {
        console.log(`[👀 OBSERVER] Signals Collected: ${event.payload.signal_count} signals`);
        // Print signal sources to verify YouTube
        console.log('Signal Sources:', event.payload.sources);
    });

    eventBus.subscribe('OpportunityResearch.BriefPublished', 'Observer', async (event) => {
        console.log(`[👀 OBSERVER] Brief Published!`);
        console.log(JSON.stringify(event.payload.brief_json, null, 2));
        console.log('--- Test Complete (SUCCESS) ---');
        process.exit(0);
    });

    eventBus.subscribe('OpportunityResearch.Aborted', 'Observer', async (event) => {
        console.error(`[❌ OBSERVER] Research Aborted: ${event.payload.reason}`);
        process.exit(1);
    });

    // 4. Trigger
    console.log('--- Triggering OpportunityResearch.Requested ---');
    // Use a popular category and add a description to maximize API call success
    await eventBus.publish('OpportunityResearch.Requested', {
        request_id: 'full-test-2',
        criteria: {
            category: 'Fitness',
            description: 'Find trending fitness products, analyze competitors, check shop compliance, and get related YouTube videos.'
        }
    });

    // Keep alive
    setTimeout(() => {
        console.log('Timeout waiting for events...');
        process.exit(1);
    }, 60000); // 60s timeout for AI
}

testFullResearch().catch(console.error);
