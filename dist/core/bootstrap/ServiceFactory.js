import { PostgresAdapter } from '../../infra/db/PostgresAdapter.js';
import { PostgresEventStore } from '../../infra/eventbus/PostgresEventStore.js';
// Shop
import { LiveShopAdapter } from '../../infra/shop/LiveShopAdapter.js';
import { MockShopAdapter } from '../../infra/shop/MockShopAdapter.js';
import { ShopifyMcpWrapper } from '../../infra/mcp/wrappers/ShopifyMcpWrapper.js';
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
        return new PostgresAdapter();
    }
    createEventBus() {
        // Currently only Postgres is supported/requested
        return new PostgresEventStore();
    }
    /**
     * Creates an adapter instance based on the class name from configuration
     * and the current system mode (live/simulation).
     */
    createAdapter(className, deps) {
        const mode = this.config.bootstrap.system.mode;
        const isLive = mode === 'live';
        switch (className) {
            case 'ShopifyAdapter':
                return isLive ? new LiveShopAdapter() : new MockShopAdapter();
            case 'AdsAdapter':
                return isLive ? new LiveAdsAdapter() : new MockAdsAdapter();
            case 'TrendAdapter':
                if (isLive) {
                    if (!deps || !deps.db) {
                        throw new Error("LiveTrendAdapter requires a database connection (deps.db).");
                    }
                    // Assuming deps.db is PostgresAdapter which has getPool()
                    return new LiveTrendAdapter(deps.db.getPool());
                }
                return new MockTrendAdapter();
            case 'CompetitorAdapter':
                return isLive ? new LiveCompetitorAdapter() : new MockCompetitorAdapter();
            case 'FulfilmentAdapter':
                return isLive ? new LiveFulfilmentAdapter() : new MockFulfilmentAdapter();
            case 'EmailAdapter':
                return isLive ? new LiveEmailAdapter() : new MockEmailAdapter();
            case 'AiAdapter':
                return isLive ? new LiveAiAdapter() : new MockAiAdapter();
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
            // TODO: Implement wrappers for other adapters
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
                return new CEOAgent(deps.db, deps.ai);
            case 'ProductResearchAgent':
                return new ProductResearchAgent(deps.db, deps.trend, deps.competitor);
            case 'SupplierAgent':
                return new SupplierAgent(deps.db, deps.fulfilment);
            case 'StoreBuildAgent':
                return new StoreBuildAgent(deps.db, deps.shop);
            case 'MarketingAgent':
                return new MarketingAgent(deps.db, deps.ads);
            case 'CustomerServiceAgent':
                return new CustomerServiceAgent(deps.db, deps.email);
            case 'OperationsAgent':
                return new OperationsAgent(deps.db);
            case 'AnalyticsAgent':
                return new AnalyticsAgent(deps.db);
            default:
                throw new Error(`Unknown agent class: ${className}`);
        }
    }
}
