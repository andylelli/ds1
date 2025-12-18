import { PostgresEventBus } from './infra/events/PostgresEventBus.js';
import { MockAdapter } from './infra/db/MockAdapter.js';
import { ProductResearchAgent } from './agents/ProductResearchAgent.js';
import { SupplierAgent } from './agents/SupplierAgent.js';
import { StoreBuildAgent } from './agents/StoreBuildAgent.js';
import { MarketingAgent } from './agents/MarketingAgent.js';
import { MockTrendAdapter } from './infra/trends/GoogleTrendsAPI/MockTrendAdapter.js';
import { MockCompetitorAdapter } from './infra/research/MockCompetitorAdapter.js';
import { MockFulfilmentAdapter } from './infra/fulfilment/MockFulfilmentAdapter.js';
import { MockShopAdapter } from './infra/shop/MockShopAdapter.js';
import { MockAdsAdapter } from './infra/ads/MockAdsAdapter.js';

async function testExecutionVertical() {
    console.log('--- Starting Execution Vertical Test ---');

    // 1. Infrastructure
    const db = new MockAdapter();
    const eventBus = new PostgresEventBus(db);
    const trendAnalyzer = new MockTrendAdapter();
    const competitorAnalyzer = new MockCompetitorAdapter();
    const fulfilment = new MockFulfilmentAdapter();
    const shop = new MockShopAdapter();
    const ads = new MockAdsAdapter();

    // 2. Agents
    const researcher = new ProductResearchAgent(db, eventBus, trendAnalyzer, competitorAnalyzer);
    const supplier = new SupplierAgent(db, eventBus, fulfilment);
    const store = new StoreBuildAgent(db, eventBus, shop);
    const marketing = new MarketingAgent(db, eventBus, ads);

    // 3. Observer
    eventBus.subscribe('OpportunityResearch.BriefPublished', 'Observer', async (event) => {
        console.log(`[👀 OBSERVER] Brief Published: ${event.payload.brief_id}`);
    });

    eventBus.subscribe('Supplier.Found', 'Observer', async (event) => {
        console.log(`[👀 OBSERVER] Supplier Found: ${event.payload.supplier.name}`);
    });

    eventBus.subscribe('Store.PageCreated', 'Observer', async (event) => {
        console.log(`[👀 OBSERVER] Store Page Created: ${event.payload.pageUrl}`);
    });

    eventBus.subscribe('Marketing.CampaignStarted', 'Observer', async (event) => {
        console.log(`[👀 OBSERVER] Campaign Started: ${event.payload.campaign.id}`);
        console.log('--- Test Complete ---');
        process.exit(0);
    });

    // 4. Trigger
    console.log('--- Triggering OpportunityResearch.Requested ---');
    await eventBus.publish('OpportunityResearch.Requested', {
        request_id: 'exec-test-1',
        criteria: { category: 'Fitness' }
    });

    // Keep alive
    setTimeout(() => {
        console.log('Timeout waiting for events...');
        process.exit(1);
    }, 10000);
}

testExecutionVertical().catch(console.error);
