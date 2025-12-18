export * from './config/ConfigService.js';

// Database
export * from './db/PostgresAdapter.js';

// AI
export * from './ai/OpenAIService.js';

// Event Bus
export * from './events/PostgresEventBus.js';

// Shop
export * from './shop/MockShopAdapter.js';
export * from './shop/TestShopAdapter.js';
export * from './shop/LiveShopAdapter.js';
export * from './shop/ShopifyService.js';

// Ads
export * from './ads/MockAdsAdapter.js';
export * from './ads/TestAdsAdapter.js';
export * from './ads/LiveAdsAdapter.js';

// Trends
export * from './trends/GoogleTrendsAPI/MockTrendAdapter.js';
export * from './trends/GoogleTrendsAPI/LiveTrendAdapter.js';

// Research (Competitors)
export * from './research/MockCompetitorAdapter.js';
export * from './research/LiveCompetitorAdapter.js';

// Fulfilment
export * from './fulfilment/MockFulfilmentAdapter.js';
export * from './fulfilment/LiveFulfilmentAdapter.js';

// Email
export * from './email/MockEmailAdapter.js';
export * from './email/LiveEmailAdapter.js';

// Logging
export * from './logging/ConsoleLoggerAdapter.js';
export * from './logging/FileLoggerAdapter.js';
