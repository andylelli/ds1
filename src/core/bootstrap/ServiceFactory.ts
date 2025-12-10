import { AppConfig } from './ConfigTypes.js';
import { PostgresAdapter } from '../../infra/db/PostgresAdapter.js';
import { PostgresEventStore } from '../../infra/eventbus/PostgresEventStore.js';

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
import { LiveAdsAdapter } from '../../infra/ads/LiveAdsAdapter.js';
import { MockAdsAdapter } from '../../infra/ads/MockAdsAdapter.js';
import { TestAdsAdapter } from '../../infra/ads/TestAdsAdapter.js';

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
    // Currently only Postgres is supported/requested
    return new PostgresAdapter();
  }

  public createEventBus(): EventBusPort {
    // Currently only Postgres is supported/requested
    return new PostgresEventStore();
  }

  /**
   * Creates an adapter instance based on the class name from configuration
   * and the current system mode (live/simulation).
   */
  public createAdapter(className: string, deps?: any): any {
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
