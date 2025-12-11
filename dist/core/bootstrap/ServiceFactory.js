import { PostgresAdapter } from '../../infra/db/PostgresAdapter.js';
import { PostgresEventStore } from '../../infra/eventbus/PostgresEventStore.js';
// Shop
import { LiveShopAdapter } from '../../infra/shop/LiveShopAdapter.js';
import { MockShopAdapter } from '../../infra/shop/MockShopAdapter.js';
import { ShopifyMcpWrapper } from '../../infra/mcp/wrappers/ShopifyMcpWrapper.js';
import { AdsMcpWrapper } from '../../infra/mcp/wrappers/AdsMcpWrapper.js';
import { TrendMcpWrapper } from '../../infra/mcp/wrappers/TrendMcpWrapper.js';
import { CompetitorMcpWrapper } from '../../infra/mcp/wrappers/CompetitorMcpWrapper.js';
import { FulfilmentMcpWrapper } from '../../infra/mcp/wrappers/FulfilmentMcpWrapper.js';
import { EmailMcpWrapper } from '../../infra/mcp/wrappers/EmailMcpWrapper.js';
import { AiMcpWrapper } from '../../infra/mcp/wrappers/AiMcpWrapper.js';
// Ads
import { LiveAdsAdapter } from '../../infra/ads/LiveAdsAdapter.js';
import { MockAdsAdapter } from '../../infra/ads/MockAdsAdapter.js';
// Trends
import { LiveTrendAdapter } from '../../infra/trends/LiveTrendAdapter.js';
import { MockTrendAdapter } from '../../infra/trends/MockTrendAdapter.js';
// Research / Competitor
import { LiveCompetitorAdapter } from '../../infra/research/LiveCompetitorAdapter.js';
import { MockCompetitorAdapter } from '../../infra/research/MockCompetitorAdapter.js';
// Fulfilment
import { LiveFulfilmentAdapter } from '../../infra/fulfilment/LiveFulfilmentAdapter.js';
import { MockFulfilmentAdapter } from '../../infra/fulfilment/MockFulfilmentAdapter.js';
// Email
import { LiveEmailAdapter } from '../../infra/email/LiveEmailAdapter.js';
import { MockEmailAdapter } from '../../infra/email/MockEmailAdapter.js';
// AI
import { LiveAiAdapter } from '../../infra/ai/LiveAiAdapter.js';
import { MockAiAdapter } from '../../infra/ai/MockAiAdapter.js';
// Agents
import { CEOAgent } from '../../agents/CEOAgent.js';
import { ProductResearchAgent } from '../../agents/ProductResearchAgent.js';
import { SupplierAgent } from '../../agents/SupplierAgent.js';
import { StoreBuildAgent } from '../../agents/StoreBuildAgent.js';
import { MarketingAgent } from '../../agents/MarketingAgent.js';
import { CustomerServiceAgent } from '../../agents/CustomerServiceAgent.js';
import { OperationsAgent } from '../../agents/OperationsAgent.js';
import { AnalyticsAgent } from '../../agents/AnalyticsAgent.js';
export class ServiceFactory {
    config;
    constructor(config) {
        this.config = config;
    }
    createPersistence() {
        // Currently only Postgres is supported/requested
        const dbConfig = this.config.infrastructure?.database;
        return new PostgresAdapter(dbConfig?.live_url, dbConfig?.simulation_url);
    }
    createEventBus() {
        // Always use PostgresEventStore
        const dbConfig = this.config.infrastructure?.database;
        return new PostgresEventStore(dbConfig?.live_url, dbConfig?.simulation_url);
    }
    /**
     * Creates an adapter instance based on the class name from configuration
     * and the current system mode (live/simulation).
     */
    createAdapter(className, deps) {
        const systemMode = this.config.bootstrap.system.mode;
        const services = this.config.bootstrap.services || {};
        // Helper to determine if a specific service should be live
        const isServiceLive = (serviceKey) => {
            const serviceMode = services[serviceKey];
            if (serviceMode)
                return serviceMode === 'live';
            return systemMode === 'live';
        };
        switch (className) {
            case 'ShopifyAdapter':
                return isServiceLive('shop') ? new LiveShopAdapter() : new MockShopAdapter();
            case 'AdsAdapter':
                const isLive = isServiceLive('ads');
                console.log(`[ServiceFactory] Creating AdsAdapter. Live mode: ${isLive}`);
                return isLive ? new LiveAdsAdapter() : new MockAdsAdapter();
            case 'TrendAdapter':
                if (isServiceLive('trends')) {
                    if (!deps || !deps.db) {
                        throw new Error("LiveTrendAdapter requires a database connection (deps.db).");
                    }
                    // Assuming deps.db is PostgresAdapter which has getPool()
                    return new LiveTrendAdapter(deps.db.getPool());
                }
                return new MockTrendAdapter();
            case 'CompetitorAdapter':
                return isServiceLive('competitor') ? new LiveCompetitorAdapter() : new MockCompetitorAdapter();
            case 'FulfilmentAdapter':
                return isServiceLive('fulfilment') ? new LiveFulfilmentAdapter() : new MockFulfilmentAdapter();
            case 'EmailAdapter':
                return isServiceLive('email') ? new LiveEmailAdapter() : new MockEmailAdapter();
            case 'AiAdapter':
                return isServiceLive('ai') ? new LiveAiAdapter() : new MockAiAdapter();
            default:
                throw new Error(`Unknown adapter class: ${className}`);
        }
    }
    /**
     * Creates an MCP wrapper for a given adapter instance.
     */
    createMcpWrapper(className, adapterInstance) {
        switch (className) {
            case 'ShopifyAdapter':
                return new ShopifyMcpWrapper(adapterInstance);
            case 'AdsAdapter':
                return new AdsMcpWrapper(adapterInstance);
            case 'TrendAdapter':
                return new TrendMcpWrapper(adapterInstance);
            case 'CompetitorAdapter':
                return new CompetitorMcpWrapper(adapterInstance);
            case 'FulfilmentAdapter':
                return new FulfilmentMcpWrapper(adapterInstance);
            case 'EmailAdapter':
                return new EmailMcpWrapper(adapterInstance);
            case 'AiAdapter':
                return new AiMcpWrapper(adapterInstance);
            default:
                return null;
        }
    }
    /**
     * Creates an agent instance with injected dependencies.
     */
    createAgent(className, deps) {
        switch (className) {
            case 'CEOAgent':
                return new CEOAgent(deps.db, deps.eventBus, deps.ai);
            case 'ProductResearchAgent':
                return new ProductResearchAgent(deps.db, deps.eventBus, deps.trend, deps.competitor);
            case 'SupplierAgent':
                return new SupplierAgent(deps.db, deps.eventBus, deps.fulfilment);
            case 'StoreBuildAgent':
                return new StoreBuildAgent(deps.db, deps.eventBus, deps.shop);
            case 'MarketingAgent':
                console.log(`[ServiceFactory] Creating MarketingAgent with ads adapter: ${deps.ads ? deps.ads.constructor.name : 'undefined'}`);
                return new MarketingAgent(deps.db, deps.eventBus, deps.ads);
            case 'CustomerServiceAgent':
                return new CustomerServiceAgent(deps.db, deps.eventBus, deps.email);
            case 'OperationsAgent':
                return new OperationsAgent(deps.db, deps.eventBus);
            case 'AnalyticsAgent':
                return new AnalyticsAgent(deps.db, deps.eventBus);
            default:
                throw new Error(`Unknown agent class: ${className}`);
        }
    }
}
