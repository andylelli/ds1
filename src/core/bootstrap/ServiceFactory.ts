import { AppConfig } from './ConfigTypes.js';
import { PostgresAdapter } from '../../infra/db/PostgresAdapter.js';
import { MockAdapter } from '../../infra/db/MockAdapter.js';
import { PostgresEventBus } from '../../infra/events/PostgresEventBus.js';
import { ResearchStagingService } from '../services/ResearchStagingService.js';

// Shop
import { LiveShopAdapter } from '../../infra/shop/LiveShopAdapter.js';
import { MockShopAdapter } from '../../infra/shop/MockShopAdapter.js';
import { TestShopAdapter } from '../../infra/shop/TestShopAdapter.js';
import { ShopifyMcpWrapper } from '../../infra/mcp/wrappers/ShopifyMcpWrapper.js';
import { AdsMcpWrapper } from '../../infra/mcp/wrappers/AdsMcpWrapper.js';
import { TrendMcpWrapper } from '../../infra/mcp/wrappers/TrendMcpWrapper.js';
import { CompetitorMcpWrapper } from '../../infra/mcp/wrappers/CompetitorMcpWrapper.js';
import { FulfilmentMcpWrapper } from '../../infra/mcp/wrappers/FulfilmentMcpWrapper.js';
import { EmailMcpWrapper } from '../../infra/mcp/wrappers/EmailMcpWrapper.js';
import { AiMcpWrapper } from '../../infra/mcp/wrappers/AiMcpWrapper.js';

// Ads
import { LiveAdsAdapter } from '../../infra/ads/GoogleAds/LiveAdsAdapter.js';
import { MockAdsAdapter } from '../../infra/ads/GoogleAds/MockAdsAdapter.js';
import { TestAdsAdapter } from '../../infra/ads/GoogleAds/TestAdsAdapter.js';

// Trends
import { LiveTrendAdapter } from '../../infra/trends/GoogleTrendsAPI/LiveTrendAdapter.js';
import { MockTrendAdapter } from '../../infra/trends/GoogleTrendsAPI/MockTrendAdapter.js';

// Research / Competitor
import { LiveCompetitorAdapter } from '../../infra/research/Meta/LiveCompetitorAdapter.js';
import { MockCompetitorAdapter } from '../../infra/research/Meta/MockCompetitorAdapter.js';

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

// Ports (for return types)
import { PersistencePort } from '../../core/domain/ports/PersistencePort.js';
import { EventBusPort } from '../../core/domain/ports/EventBusPort.js';
import { McpToolProvider } from '../mcp/McpToolProvider.js';

export class ServiceFactory {
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
  }

  public createPersistence(): PersistencePort {
    if (process.env.DS1_MODE === 'mock') {
        return new MockAdapter();
    }
    // Currently only Postgres is supported/requested
    const dbConfig = this.config.infrastructure?.database;
    return new PostgresAdapter(dbConfig?.live_url, dbConfig?.simulation_url);
  }

  public createEventBus(): EventBusPort {
    const dbConfig = this.config.infrastructure?.database;
    const persistence = new PostgresAdapter(dbConfig?.live_url, dbConfig?.simulation_url);
    return new PostgresEventBus(persistence);
  }

  public createStagingService(persistence: PersistencePort): ResearchStagingService {
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
  public createAdapter(className: string, deps?: any): any {
    const systemMode = this.config.bootstrap.system.mode;
    const services = this.config.bootstrap.services || {};

    // Helper to determine if a specific service should be live
    const isServiceLive = (serviceKey: keyof typeof services) => {
        const serviceMode = services[serviceKey];
        if (serviceMode) return serviceMode === 'live';
        return systemMode === 'live';
    };

    switch (className) {
      case 'ShopifyAdapter':
        if (isServiceLive('shop')) {
            const pool = (deps && deps.db && typeof deps.db.getPool === 'function') ? deps.db.getPool() : undefined;
            return new LiveShopAdapter(pool);
        }
        return new MockShopAdapter();
      
      case 'AdsAdapter':
        const isLive = isServiceLive('ads');
        console.log(`[ServiceFactory] Creating AdsAdapter. Live mode: ${isLive}`);
        if (isLive) {
            const pool = (deps && deps.db && typeof deps.db.getPool === 'function') ? deps.db.getPool() : undefined;
            return new LiveAdsAdapter(pool);
        }
        return new MockAdsAdapter();
      
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
        if (isServiceLive('fulfilment')) {
            const pool = (deps && deps.db && typeof deps.db.getPool === 'function') ? deps.db.getPool() : undefined;
            return new LiveFulfilmentAdapter(pool);
        }
        return new MockFulfilmentAdapter();
      
      case 'EmailAdapter':
        return isServiceLive('email') ? new LiveEmailAdapter() : new MockEmailAdapter();
        
      case 'AiAdapter':
        if (isServiceLive('ai')) {
            // Pass DB pool if available for logging
            const pool = (deps && deps.db && typeof deps.db.getPool === 'function') ? deps.db.getPool() : undefined;
            return new LiveAiAdapter(pool);
        }
        return new MockAiAdapter();

      default:
        throw new Error(`Unknown adapter class: ${className}`);
    }
  }

  /**
   * Creates an MCP wrapper for a given adapter instance.
   */
  public createMcpWrapper(className: string, adapterInstance: any): McpToolProvider | null {
      switch(className) {
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
  public createAgent(className: string, deps: any): any {
    switch (className) {
      case 'CEOAgent':
        return new CEOAgent(deps.db, deps.eventBus, deps.ai, deps.staging);
      case 'ProductResearchAgent':
        return new ProductResearchAgent(deps.db, deps.eventBus, deps.trend, deps.competitor, deps.ads);
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
