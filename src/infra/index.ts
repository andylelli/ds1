export * from './config/ConfigService.js';

// Database
export * from './db/PostgresAdapter.js';

// AI
export * from './ai/OpenAI/OpenAIService.js';

// Event Bus
export * from './events/PostgresEventBus.js';

// Shop
export * from './shop/Shopify/MockShopAdapter.js';
export * from './shop/Shopify/TestShopAdapter.js';
export * from './shop/Shopify/LiveShopAdapter.js';
export * from './shop/Shopify/ShopifyService.js';

// Ads
export * from './ads/GoogleAds/MockAdsAdapter.js';
export * from './ads/GoogleAds/TestAdsAdapter.js';
export * from './ads/GoogleAds/LiveAdsAdapter.js';

// Trends
export * from './trends/GoogleTrendsAPI/MockTrendAdapter.js';
export * from './trends/GoogleTrendsAPI/LiveTrendAdapter.js';

// Research (Competitors)
export * from './research/Meta/MockCompetitorAdapter.js';
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
