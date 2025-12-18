import { PostgresEventBus } from './infra/events/PostgresEventBus.js';
import { MockAdapter } from './infra/db/MockAdapter.js';
import { ProductResearchAgent } from './agents/ProductResearchAgent.js';
import { CEOAgent } from './agents/CEOAgent.js';
import { SupplierAgent } from './agents/SupplierAgent.js';
import { StoreBuildAgent } from './agents/StoreBuildAgent.js';
import { MarketingAgent } from './agents/MarketingAgent.js';
import { MockTrendAdapter } from './infra/trends/GoogleTrendsAPI/MockTrendAdapter.js';
import { MockCompetitorAdapter } from './infra/research/MockCompetitorAdapter.js';
import { MockFulfilmentAdapter } from './infra/fulfilment/MockFulfilmentAdapter.js';
import { MockShopAdapter } from './infra/shop/MockShopAdapter.js';
import { MockAdsAdapter } from './infra/ads/MockAdsAdapter.js';
import { MockAiAdapter } from './infra/ai/MockAiAdapter.js';
import { OperationsAgent } from './agents/OperationsAgent.js';
import { CustomerServiceAgent } from './agents/CustomerServiceAgent.js';
import { AnalyticsAgent } from './agents/AnalyticsAgent.js';
import { MockEmailAdapter } from './infra/email/MockEmailAdapter.js';
async function runFullWorkflow() {
    console.log('--- Starting Full Autonomous Workflow Test ---');
    // 1. Infrastructure
    const db = new MockAdapter();
    const eventBus = new PostgresEventBus(db);
    const trendAnalyzer = new MockTrendAdapter();
    const competitorAnalyzer = new MockCompetitorAdapter();
    const fulfilment = new MockFulfilmentAdapter();
    const shop = new MockShopAdapter();
    const ads = new MockAdsAdapter();
    const ai = new MockAiAdapter();
    const email = new MockEmailAdapter();
    // 2. Agents
    const researcher = new ProductResearchAgent(db, eventBus, trendAnalyzer, competitorAnalyzer);
    const ceo = new CEOAgent(db, eventBus, ai);
    const supplierAgent = new SupplierAgent(db, eventBus, fulfilment);
    const storeAgent = new StoreBuildAgent(db, eventBus, shop);
    const marketingAgent = new MarketingAgent(db, eventBus, ads);
    const operationsAgent = new OperationsAgent(db, eventBus);
    const customerServiceAgent = new CustomerServiceAgent(db, eventBus, email);
    const analyticsAgent = new AnalyticsAgent(db, eventBus);
    // 3. Subscribe Agents to Events (Wiring)
    // Research -> CEO
    eventBus.subscribe('Product.Found', 'CEO_Reviewer', async (event) => {
        console.log(`[Event] Product.Found: ${event.payload.product.name}`);
        await ceo.review_product(event.payload);
    });
    // CEO (Approve Product) -> Supplier
    eventBus.subscribe('Product.Approved', 'Supplier_Finder', async (event) => {
        console.log(`[Event] Product.Approved: ${event.payload.product.name}`);
        await supplierAgent.find_suppliers(event.payload);
    });
    // Supplier -> CEO (Review Supplier)
    eventBus.subscribe('Supplier.Found', 'CEO_Supplier_Reviewer', async (event) => {
        console.log(`[Event] Supplier.Found: ${event.payload.supplier.name} for ${event.payload.product.name}`);
        await ceo.review_supplier(event.payload);
    });
    // CEO (Approve Supplier) -> Store
    eventBus.subscribe('Supplier.Approved', 'Store_Builder', async (event) => {
        console.log(`[Event] Supplier.Approved: ${event.payload.supplier.name} for ${event.payload.product.name}`);
        await storeAgent.create_product_page(event.payload);
    });
    // Store -> Marketing
    eventBus.subscribe('Store.PageCreated', 'Marketing_Campaigner', async (event) => {
        console.log(`[Event] Store.PageCreated: ${event.payload.product.name} at ${event.payload.pageUrl}`);
        await marketingAgent.create_ad_campaign(event.payload);
    });
    // Marketing -> Done
    eventBus.subscribe('Marketing.CampaignStarted', 'Workflow_Monitor', async (event) => {
        console.log(`[Event] Marketing.CampaignStarted: Campaign ${event.payload.campaign.id} for ${event.payload.product.name}`);
        // Simulate an order coming in after campaign starts
        console.log('--- Simulating Customer Order ---');
        const order = { id: 'ord_' + Date.now(), product: event.payload.product, customerEmail: 'test@customer.com' };
        await eventBus.publish('Sales.OrderReceived', { order_id: order.id, items: [order], total: 100 });
    });
    // Operations -> Customer Service
    eventBus.subscribe('Sales.OrderReceived', 'Operations_Manager', async (event) => {
        console.log(`[Event] Sales.OrderReceived: ${event.payload.order_id}`);
        await operationsAgent.process_order({ order: { id: event.payload.order_id } });
    });
    // Customer Service -> Done
    eventBus.subscribe('Sales.OrderShipped', 'CS_Agent', async (event) => {
        console.log(`[Event] Sales.OrderShipped: ${event.payload.order.id} Tracking: ${event.payload.tracking}`);
        await customerServiceAgent.notify_customer(event.payload);
        // Trigger Analytics
        await eventBus.publish('Analytics.ReportRequested', { period: 'daily' });
    });
    // Analytics
    eventBus.subscribe('Analytics.ReportRequested', 'Analytics_Engine', async (event) => {
        console.log(`[Event] Analytics.ReportRequested: ${event.payload.period}`);
        await analyticsAgent.generate_report(event.payload);
        console.log('--- Workflow Complete! ---');
    });
    // 4. Kickoff
    console.log('--- Kicking off workflow with RESEARCH_REQUESTED ---');
    await researcher.find_products({ category: 'Tech Gadgets' });
}
runFullWorkflow().catch(console.error);
