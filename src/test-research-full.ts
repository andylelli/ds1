
import dotenv from 'dotenv';
dotenv.config(); // Load env vars FIRST

import { PostgresEventBus } from './infra/events/PostgresEventBus.js';
import { MockAdapter } from './infra/db/MockAdapter.js';
import { ProductResearchAgent } from './agents/ProductResearchAgent.js';
import { LiveTrendAdapter } from './infra/trends/GoogleTrendsAPI/LiveTrendAdapter.js';
import { LiveAdsAdapter } from './infra/ads/LiveAdsAdapter.js';
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
    
    const trendAnalyzer = new LiveTrendAdapter(mockPool, false);
    const adsAdapter = new LiveAdsAdapter(mockPool);
    const competitorAnalyzer = new MockCompetitorAdapter();

    // 2. Agent
    // Note: We need to ensure the agent uses the adsAdapter for validation if we want to test that.
    // Currently ProductResearchAgent might not be wired to use AdsAdapter for validation yet.
    const researcher = new ProductResearchAgent(db, eventBus, trendAnalyzer, competitorAnalyzer, adsAdapter);

    // 3. Observer
    eventBus.subscribe('OpportunityResearch.BriefCreated', 'Observer', async (event) => {
        console.log(`[👀 OBSERVER] Brief Created: ${event.payload.brief_id}`);
    });

    eventBus.subscribe('OpportunityResearch.SignalsCollected', 'Observer', async (event) => {
        console.log(`[👀 OBSERVER] Signals Collected: ${event.payload.signal_count} signals`);
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
    await eventBus.publish('OpportunityResearch.Requested', {
        request_id: 'full-test-1',
        criteria: { category: 'Smart Home' }
    });

    // Keep alive
    setTimeout(() => {
        console.log('Timeout waiting for events...');
        process.exit(1);
    }, 60000); // 60s timeout for AI
}

testFullResearch().catch(console.error);
