import { PostgresEventStore } from './infra/eventbus/PostgresEventStore.js';
import { MockAdapter } from './infra/db/MockAdapter.js';
import { ProductResearchAgent } from './agents/ProductResearchAgent.js';
import { CEOAgent } from './agents/CEOAgent.js';
import { SupplierAgent } from './agents/SupplierAgent.js';
import { StoreBuildAgent } from './agents/StoreBuildAgent.js';
import { MarketingAgent } from './agents/MarketingAgent.js';
import { MockTrendAdapter } from './infra/trends/MockTrendAdapter.js';
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
    const eventBus = new PostgresEventStore();
    const db = new MockAdapter();
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
    eventBus.subscribe('PRODUCT_FOUND', 'CEO_Reviewer', async (payload: any) => {
        console.log(`[Event] PRODUCT_FOUND: ${payload.product.name}`);
        await ceo.review_product(payload);
    });

    // CEO (Approve Product) -> Supplier
    eventBus.subscribe('PRODUCT_APPROVED', 'Supplier_Finder', async (payload: any) => {
        console.log(`[Event] PRODUCT_APPROVED: ${payload.product.name}`);
        await supplierAgent.find_suppliers(payload);
    });

    // Supplier -> CEO (Review Supplier)
    eventBus.subscribe('SUPPLIER_FOUND', 'CEO_Supplier_Reviewer', async (payload: any) => {
        console.log(`[Event] SUPPLIER_FOUND: ${payload.supplier.name} for ${payload.product.name}`);
        await ceo.review_supplier(payload);
    });

    // CEO (Approve Supplier) -> Store
    eventBus.subscribe('SUPPLIER_APPROVED', 'Store_Builder', async (payload: any) => {
        console.log(`[Event] SUPPLIER_APPROVED: ${payload.supplier.name} for ${payload.product.name}`);
        await storeAgent.create_product_page(payload);
    });

    // Store -> Marketing
    eventBus.subscribe('PRODUCT_PAGE_CREATED', 'Marketing_Campaigner', async (payload: any) => {
        console.log(`[Event] PRODUCT_PAGE_CREATED: ${payload.product.name} at ${payload.pageUrl}`);
        await marketingAgent.create_ad_campaign(payload);
    });

    // Marketing -> Done
    eventBus.subscribe('CAMPAIGN_STARTED', 'Workflow_Monitor', async (payload: any) => {
        console.log(`[Event] CAMPAIGN_STARTED: Campaign ${payload.campaign.id} for ${payload.product.name}`);
        
        // Simulate an order coming in after campaign starts
        console.log('--- Simulating Customer Order ---');
        const order = { id: 'ord_' + Date.now(), product: payload.product, customerEmail: 'test@customer.com' };
        await eventBus.publish('ORDER_RECEIVED', 'Simulation', { order });
    });

    // Operations -> Customer Service
    eventBus.subscribe('ORDER_RECEIVED', 'Operations_Manager', async (payload: any) => {
        console.log(`[Event] ORDER_RECEIVED: ${payload.order.id}`);
        await operationsAgent.process_order(payload);
    });

    // Customer Service -> Done
    eventBus.subscribe('ORDER_SHIPPED', 'CS_Agent', async (payload: any) => {
        console.log(`[Event] ORDER_SHIPPED: ${payload.order.id} Tracking: ${payload.tracking}`);
        await customerServiceAgent.notify_customer(payload);
        
        // Trigger Analytics
        await eventBus.publish('DAILY_REPORT_REQUESTED', 'Simulation', { period: 'daily' });
    });

    // Analytics
    eventBus.subscribe('DAILY_REPORT_REQUESTED', 'Analytics_Engine', async (payload: any) => {
        console.log(`[Event] DAILY_REPORT_REQUESTED: ${payload.period}`);
        await analyticsAgent.generate_report(payload);
        console.log('--- Workflow Complete! ---');
    });

    // 4. Kickoff
    console.log('--- Kicking off workflow with RESEARCH_REQUESTED ---');
    await researcher.find_products({ category: 'Tech Gadgets' });
}

runFullWorkflow().catch(console.error);
