import { PostgresAdapter } from '../../infra/db/PostgresAdapter.js';
import { MockAdapter } from '../../infra/db/MockAdapter.js';
import { PostgresEventBus } from '../../infra/events/PostgresEventBus.js';
import { ResearchStagingService } from '../services/ResearchStagingService.js';
// Shop
import { LiveShopAdapter } from '../../infra/shop/Shopify/LiveShopAdapter.js';
import { MockShopAdapter } from '../../infra/shop/Shopify/MockShopAdapter.js';
import { ShopifyMcpWrapper } from '../../infra/mcp/wrappers/ShopifyMcpWrapper.js';
import { AdsMcpWrapper } from '../../infra/mcp/wrappers/AdsMcpWrapper.js';
import { TrendMcpWrapper } from '../../infra/mcp/wrappers/TrendMcpWrapper.js';
import { CompetitorMcpWrapper } from '../../infra/mcp/wrappers/CompetitorMcpWrapper.js';
import { FulfilmentMcpWrapper } from '../../infra/mcp/wrappers/FulfilmentMcpWrapper.js';
import { EmailMcpWrapper } from '../../infra/mcp/wrappers/EmailMcpWrapper.js';
import { AiMcpWrapper } from '../../infra/mcp/wrappers/AiMcpWrapper.js';
import { VideoMcpWrapper } from '../../infra/mcp/wrappers/VideoMcpWrapper.js';
// Ads
import { LiveAdsAdapter } from '../../infra/ads/GoogleAds/LiveAdsAdapter.js';
import { MockAdsAdapter } from '../../infra/ads/GoogleAds/MockAdsAdapter.js';
// Trends
import { LiveTrendAdapter } from '../../infra/trends/GoogleTrendsAPI/LiveTrendAdapter.js';
import { MockTrendAdapter } from '../../infra/trends/GoogleTrendsAPI/MockTrendAdapter.js';
// Research / Competitor
import { LiveCompetitorAdapter } from '../../infra/research/Meta/LiveCompetitorAdapter.js';
import { MockCompetitorAdapter } from '../../infra/research/Meta/MockCompetitorAdapter.js';
import { LiveVideoAdapter } from '../../infra/research/YouTube/LiveVideoAdapter.js';
// Fulfilment
import { LiveFulfilmentAdapter } from '../../infra/fulfilment/LiveFulfilmentAdapter.js';
import { MockFulfilmentAdapter } from '../../infra/fulfilment/MockFulfilmentAdapter.js';
// Email
import { LiveEmailAdapter } from '../../infra/email/LiveEmailAdapter.js';
import { MockEmailAdapter } from '../../infra/email/MockEmailAdapter.js';
// AI
import { LiveAiAdapter } from '../../infra/ai/OpenAI/LiveAiAdapter.js';
import { MockAiAdapter } from '../../infra/ai/OpenAI/MockAiAdapter.js';
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
        if (process.env.DS1_MODE === 'mock') {
            return new MockAdapter();
        }
        // Currently only Postgres is supported/requested
        const dbConfig = this.config.infrastructure?.database;
        return new PostgresAdapter(dbConfig?.live_url, dbConfig?.simulation_url);
    }
    createEventBus() {
        const dbConfig = this.config.infrastructure?.database;
        const persistence = new PostgresAdapter(dbConfig?.live_url, dbConfig?.simulation_url);
        return new PostgresEventBus(persistence);
    }
    createStagingService(persistence) {
        // Assuming persistence is PostgresAdapter
        if (persistence instanceof PostgresAdapter) {
            return new ResearchStagingService(persistence.getPool());
        }
        // Fallback or throw if not PostgresAdapter (e.g. MockAdapter)
        // For now, we can return null or throw, but let's try to handle it gracefully if possible.
        // If MockAdapter, we might need a MockStagingService.
        // But for now, let's assume PostgresAdapter.
        throw new Error("Staging Service requires PostgresAdapter");
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
            case 'ShopifyAdapter': {
                const live = isServiceLive('shop');
                console.log(`[ServiceFactory] Creating ShopAdapter. Live mode: ${live}`);
                const pool = (deps && deps.db && typeof deps.db.getPool === 'function') ? deps.db.getPool() : undefined;
                return live ? new LiveShopAdapter(pool) : new MockShopAdapter();
            }
            case 'AdsAdapter': {
                const live = isServiceLive('ads');
                console.log(`[ServiceFactory] Creating AdsAdapter. Live mode: ${live}`);
                const pool = (deps && deps.db && typeof deps.db.getPool === 'function') ? deps.db.getPool() : undefined;
                return live ? new LiveAdsAdapter(pool) : new MockAdsAdapter();
            }
            case 'TrendAdapter': {
                const live = isServiceLive('trends');
                console.log(`[ServiceFactory] Creating TrendAdapter. Live mode: ${live}`);
                if (live) {
                    if (!deps || !deps.db) {
                        throw new Error("LiveTrendAdapter requires a database connection (deps.db).");
                    }
                    return new LiveTrendAdapter(deps.db.getPool());
                }
                return new MockTrendAdapter();
            }
            case 'CompetitorAdapter': {
                const live = isServiceLive('competitor');
                console.log(`[ServiceFactory] Creating CompetitorAdapter. Live mode: ${live}`);
                const pool = (deps && deps.db && typeof deps.db.getPool === 'function') ? deps.db.getPool() : undefined;
                return live ? new LiveCompetitorAdapter(pool) : new MockCompetitorAdapter();
            }
            case 'VideoAdapter': {
                const live = isServiceLive('video');
                console.log(`[ServiceFactory] Creating VideoAdapter. Live mode: ${live}`);
                // You would add actual LiveVideoAdapter/MockVideoAdapter instantiation here
                // For now, just log and return undefined or a mock if implemented
                return undefined;
            }
            case 'LiveVideoAdapter': {
                console.log(`[ServiceFactory] Creating LiveVideoAdapter.`);
                const pool = (deps && deps.db && typeof deps.db.getPool === 'function') ? deps.db.getPool() : undefined;
                return new LiveVideoAdapter(pool);
            }
            case 'FulfilmentAdapter': {
                const live = isServiceLive('fulfilment');
                console.log(`[ServiceFactory] Creating FulfilmentAdapter. Live mode: ${live}`);
                const pool = (deps && deps.db && typeof deps.db.getPool === 'function') ? deps.db.getPool() : undefined;
                return live ? new LiveFulfilmentAdapter(pool) : new MockFulfilmentAdapter();
            }
            case 'EmailAdapter': {
                const live = isServiceLive('email');
                console.log(`[ServiceFactory] Creating EmailAdapter. Live mode: ${live}`);
                return live ? new LiveEmailAdapter() : new MockEmailAdapter();
            }
            case 'AiAdapter': {
                const live = isServiceLive('ai');
                console.log(`[ServiceFactory] Creating AiAdapter. Live mode: ${live}`);
                const pool = (deps && deps.db && typeof deps.db.getPool === 'function') ? deps.db.getPool() : undefined;
                return live ? new LiveAiAdapter(pool) : new MockAiAdapter();
            }
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
            case 'LiveVideoAdapter':
                return new VideoMcpWrapper(adapterInstance);
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
                return new CEOAgent(deps.db, deps.eventBus, deps.ai, deps.staging);
            case 'ProductResearchAgent':
                // Inject 'shop' adapter as 'shopCompliance' port
                // Inject 'video' adapter for YouTube analysis
                return new ProductResearchAgent(deps.db, deps.eventBus, deps.trend, deps.competitor, deps.ads, deps.shop, deps.video);
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
