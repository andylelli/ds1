import { PostgresEventBus } from './infra/events/PostgresEventBus.js';
import { MockAdapter } from './infra/db/MockAdapter.js';
import { ProductResearchAgent } from './agents/ProductResearchAgent.js';
import { MockTrendAdapter } from './infra/trends/GoogleTrendsAPI/MockTrendAdapter.js';
import { MockCompetitorAdapter } from './infra/research/Meta/MockCompetitorAdapter.js';

async function testResearchVertical() {
    console.log('--- Starting Research Vertical Test ---');

    // 1. Infrastructure
    const db = new MockAdapter();
    const eventBus = new PostgresEventBus(db);
    const trendAnalyzer = new MockTrendAdapter();
    const competitorAnalyzer = new MockCompetitorAdapter();

    // 2. Agent
    const researcher = new ProductResearchAgent(db, eventBus, trendAnalyzer, competitorAnalyzer);

    // 3. Observer (Simulating downstream agents or UI)
    eventBus.subscribe('OpportunityResearch.BriefCreated', 'Observer', async (event) => {
        console.log(`[👀 OBSERVER] Brief Created: ${event.payload.brief_id}`);
    });

    eventBus.subscribe('OpportunityResearch.SignalsCollected', 'Observer', async (event) => {
        console.log(`[👀 OBSERVER] Signals Collected: ${event.payload.signal_count} signals`);
    });

    eventBus.subscribe('OpportunityResearch.BriefPublished', 'Observer', async (event) => {
        console.log(`[👀 OBSERVER] Brief Published: ${event.payload.brief_id}`);
        console.log(`[👀 OBSERVER] Products: ${event.payload.brief_json.products.map((p: any) => p.name).join(', ')}`);
        console.log('--- Test Complete ---');
        process.exit(0);
    });

    eventBus.subscribe('OpportunityResearch.Aborted', 'Observer', async (event) => {
        console.error(`[❌ OBSERVER] Research Aborted: ${event.payload.reason}`);
        process.exit(1);
    });

    // 4. Trigger
    console.log('--- Triggering OpportunityResearch.Requested ---');
    await eventBus.publish('OpportunityResearch.Requested', {
        request_id: 'test-req-1',
        criteria: { category: 'Smart Home' }
    });

    // Keep alive
    setTimeout(() => {
        console.log('Timeout waiting for events...');
        process.exit(1);
    }, 5000);
}

testResearchVertical().catch(console.error);
