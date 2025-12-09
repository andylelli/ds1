// Ensure dotenv loads before anything else
import dotenv from 'dotenv';
dotenv.config();
// Minimal, gated environment debug to avoid secret leakage.
// Set `DEBUG_ENV=true` to enable a filtered, partially-masked dump of relevant vars.
const showDebugEnv = process.env.DEBUG_ENV === 'true';
function _mask(v?: string) {
  if (!v) return '<unset>';
  if (v.length <= 8) return '****';
  return `${v.slice(0, 4)}...${v.slice(-4)}`;
}
if (showDebugEnv) {
  console.log('ENV DEBUG (filtered, masked):', Object.keys(process.env)
    .filter(k => k.includes('OPENAI') || k.includes('AZURE') || k.includes('KEY'))
    .reduce((acc, k) => {
      const val = process.env[k];
      // Show full value for endpoints (urls), otherwise mask
      (acc as { [key: string]: string | undefined })[k] = typeof val === 'string' && /^https?:\/\//.test(val) ? val : _mask(val);
      return acc;
    }, {} as { [key: string]: string | undefined }));
} else {
  console.log('ENV DEBUG: disabled (set DEBUG_ENV=true to enable filtered env output)');
}
import express from 'express';
import { openAIService } from './infra/ai/OpenAIService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { CEOAgent } from './agents/CEOAgent.js';
import { ProductResearchAgent } from './agents/ProductResearchAgent.js';
import { SupplierAgent } from './agents/SupplierAgent.js';
import { StoreBuildAgent } from './agents/StoreBuildAgent.js';
import { MarketingAgent } from './agents/MarketingAgent.js';
import { CustomerServiceAgent } from './agents/CustomerServiceAgent.js';
import { OperationsAgent } from './agents/OperationsAgent.js';
import { AnalyticsAgent } from './agents/AnalyticsAgent.js';
import { PostgresAdapter } from './infra/db/PostgresAdapter.js';
import { MockShopAdapter } from './infra/shop/MockShopAdapter.js';
import { TestShopAdapter } from './infra/shop/TestShopAdapter.js';
import { LiveShopAdapter } from './infra/shop/LiveShopAdapter.js';
import { MockAdsAdapter } from './infra/ads/MockAdsAdapter.js';
import { TestAdsAdapter } from './infra/ads/TestAdsAdapter.js';
import { LiveAdsAdapter } from './infra/ads/LiveAdsAdapter.js';
import { MockTrendAdapter } from './infra/trends/MockTrendAdapter.js';
import { LiveTrendAdapter } from './infra/trends/LiveTrendAdapter.js';
import { MockCompetitorAdapter } from './infra/research/MockCompetitorAdapter.js';
import { LiveCompetitorAdapter } from './infra/research/LiveCompetitorAdapter.js';
import { MockFulfilmentAdapter } from './infra/fulfilment/MockFulfilmentAdapter.js';
import { LiveFulfilmentAdapter } from './infra/fulfilment/LiveFulfilmentAdapter.js';
import { MockEmailAdapter } from './infra/email/MockEmailAdapter.js';
import { LiveEmailAdapter } from './infra/email/LiveEmailAdapter.js';
import { configService } from './infra/config/ConfigService.js';
import { PersistencePort } from './core/domain/ports/PersistencePort.js';
import { ShopPlatformPort } from './core/domain/ports/ShopPlatformPort.js';
import { AdsPlatformPort } from './core/domain/ports/AdsPlatformPort.js';
import { TrendAnalysisPort } from './core/domain/ports/TrendAnalysisPort.js';
import { CompetitorAnalysisPort } from './core/domain/ports/CompetitorAnalysisPort.js';
import { FulfilmentPort } from './core/domain/ports/FulfilmentPort.js';
import { EmailPort } from './core/domain/ports/EmailPort.js';
import { AiPort } from './core/domain/ports/AiPort.js';
import { LiveAiAdapter } from './infra/ai/LiveAiAdapter.js';
import { MockAiAdapter } from './infra/ai/MockAiAdapter.js';

import { SimulationService } from './core/services/SimulationService.js';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// --- Startup validation (fail fast if critical env missing)
const requiredEnv = ['AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_DEPLOYMENT_NAME'];
const missing = requiredEnv.filter(k => !process.env[k]);
if (missing.length) {
  console.error('Missing required environment variables:', missing.join(', '));
  console.error('Aborting startup. Set these env vars and restart.');
  process.exit(1);
}

// Serve static files with explicit path and logging
const publicPath = path.resolve(process.cwd(), 'public');
console.log(`Serving static files from: ${publicPath}`);
app.use(express.static(publicPath));

// Prevent caching for API routes
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// Redirect root to admin panel
app.get('/', (req, res) => {
  res.redirect('/admin.html');
});

// Initialize Adapters
let db: PersistencePort;
const dbMode = String(configService.get('dbMode') || 'test');
// dbMode mapping:
// - 'live'  => use production Postgres
// - 'test'  => use test Postgres (default)
if (dbMode === 'live' || dbMode === 'test') {
  console.log(`Using ${dbMode === 'live' ? 'Live' : 'Test'} Database (Postgres)`);
  db = new PostgresAdapter();
} else {
  console.log("Using Test Database (Postgres) - Fallback");
  db = new PostgresAdapter();
}

let shopAdapter: ShopPlatformPort;
const shopMode = configService.get('shopMode');
if (shopMode === 'live') {
    console.log("Using Live Shop Adapter");
    shopAdapter = new LiveShopAdapter();
} else if (shopMode === 'test') {
    console.log("Using Test Shop Adapter");
    shopAdapter = new TestShopAdapter();
} else {
    console.log("Using Mock Shop Adapter");
    shopAdapter = new MockShopAdapter();
}

let adsAdapter: AdsPlatformPort;
const adsMode = configService.get('adsMode');
if (adsMode === 'live') {
    console.log("Using Live Ads Adapter");
    adsAdapter = new LiveAdsAdapter();
} else if (adsMode === 'test') {
    console.log("Using Test Ads Adapter");
    adsAdapter = new TestAdsAdapter();
} else {
    console.log("Using Mock Ads Adapter");
    adsAdapter = new MockAdsAdapter();
}

let trendAdapter: TrendAnalysisPort;
const trendsMode = configService.get('trendsMode');
if (trendsMode === 'live') {
    console.log("Using Live Trend Adapter");
    trendAdapter = new LiveTrendAdapter();
} else {
    console.log("Using Mock Trend Adapter");
    trendAdapter = new MockTrendAdapter();
}

let competitorAdapter: CompetitorAnalysisPort;
const researchMode = configService.get('researchMode');
if (researchMode === 'live') {
    console.log("Using Live Competitor Adapter");
    competitorAdapter = new LiveCompetitorAdapter();
} else {
    console.log("Using Mock Competitor Adapter");
    competitorAdapter = new MockCompetitorAdapter();
}

let fulfilmentAdapter: FulfilmentPort;
const fulfilmentMode = configService.get('fulfilmentMode');
if (fulfilmentMode === 'live') {
    console.log("Using Live Fulfilment Adapter");
    fulfilmentAdapter = new LiveFulfilmentAdapter();
} else {
    console.log("Using Mock Fulfilment Adapter");
    fulfilmentAdapter = new MockFulfilmentAdapter();
}

let emailAdapter: EmailPort;
const emailMode = configService.get('emailMode');
if (emailMode === 'live') {
    console.log("Using Live Email Adapter");
    emailAdapter = new LiveEmailAdapter();
} else {
    console.log("Using Mock Email Adapter");
    emailAdapter = new MockEmailAdapter();
}

let aiAdapter: AiPort;
const ceoMode = configService.get('ceoMode');
if (ceoMode === 'live') {
    console.log("Using Live AI Adapter (OpenAI)");
    aiAdapter = new LiveAiAdapter();
} else {
    console.log("Using Mock AI Adapter");
    aiAdapter = new MockAiAdapter();
}

// Initialize Agents
const agents = {
  ceo: new CEOAgent(db, aiAdapter),
  research: new ProductResearchAgent(db, trendAdapter, competitorAdapter),
  supplier: new SupplierAgent(db, fulfilmentAdapter),
  store: new StoreBuildAgent(db, shopAdapter),
  marketing: new MarketingAgent(db, adsAdapter),
  support: new CustomerServiceAgent(db, emailAdapter),
  ops: new OperationsAgent(db),
  analytics: new AnalyticsAgent(db)
};

// Inject team into CEO
agents.ceo.setTeam(agents);

// Initialize Services
const simulationService = new SimulationService(db, agents);

// --- Configuration API ---
app.get('/api/config', (req, res) => {
  res.json(configService.getAll());
});

app.post('/api/config', (req, res) => {
  const newConfig = req.body;
  configService.update(newConfig);
  res.json({ status: 'ok', config: configService.getAll() });
});

// --- Data APIs ---
app.get('/api/agents', (req, res) => {
  const trendsMode = configService.get('trendsMode');
  const researchMode = configService.get('researchMode');
  const adsMode = configService.get('adsMode');
  const shopMode = configService.get('shopMode');
  const fulfilmentMode = configService.get('fulfilmentMode');
  const emailMode = configService.get('emailMode');

  const agentMetadata = [
    { 
      id: 'ceo', 
      name: 'CEO Agent', 
      role: 'Strategy & Oversight',
      subscriptions: ['market.trends', 'finance.report', 'system.error'],
      capabilities: ['Set Strategy', 'Approve Budget', 'Review Performance'],
      externalEndpoints: ['OpenAI API']
    },
    { 
      id: 'research', 
      name: 'Product Researcher', 
      role: 'Market Research',
      subscriptions: ['market.trends', 'competitor.update'],
      capabilities: ['Find Winning Products', 'Analyze Trends', 'Check Saturation', 'Analyze Competitors'],
      externalEndpoints: [
        trendsMode === 'live' ? 'Google Trends (Live)' : 'Google Trends (Mock)',
        researchMode === 'live' ? 'Competitor Spy (Live)' : 'Competitor Spy (Mock)',
        'OpenAI API'
      ]
    },
    { 
      id: 'supplier', 
      name: 'Supplier Manager', 
      role: 'Sourcing',
      subscriptions: ['product.selected', 'supplier.negotiation'],
      capabilities: ['Find Suppliers', 'Negotiate Price', 'Check Inventory'],
      externalEndpoints: fulfilmentMode === 'live'
        ? ['AliExpress API (Live)', 'CJ Dropshipping API (Live)']
        : ['AliExpress API (Mock)', 'CJ Dropshipping API (Mock)']
    },
    { 
      id: 'store', 
      name: 'Store Builder', 
      role: 'Web Development',
      subscriptions: ['product.sourced', 'content.generated'],
      capabilities: ['Create Product Page', 'Optimize SEO', 'Setup Checkout'],
      externalEndpoints: shopMode === 'live' 
        ? ['Shopify API (Live)', 'OpenAI API'] 
        : shopMode === 'test' 
          ? ['Shopify API (Test)', 'OpenAI API'] 
          : ['Shopify API (Mock)', 'OpenAI API']
    },
    { 
      id: 'marketing', 
      name: 'Marketing Agent', 
      role: 'Advertising',
      subscriptions: ['store.published', 'campaign.performance'],
      capabilities: ['Create Ad Campaigns', 'Optimize Budget', 'Generate Creatives'],
      externalEndpoints: adsMode === 'live' 
        ? ['Facebook Ads API (Live)', 'TikTok Ads API (Live)', 'Instagram Ads API (Live)'] 
        : adsMode === 'test' 
          ? ['Facebook Ads API (Test)', 'TikTok Ads API (Test)', 'Instagram Ads API (Test)'] 
          : ['Facebook Ads API (Mock)', 'TikTok Ads API (Mock)', 'Instagram Ads API (Mock)']
    },
    { 
      id: 'support', 
      name: 'Customer Support', 
      role: 'Customer Service',
      subscriptions: ['order.created', 'customer.inquiry'],
      capabilities: ['Answer Questions', 'Process Refunds', 'Handle Disputes', 'Check Emails'],
      externalEndpoints: emailMode === 'live'
        ? ['OpenAI API', 'SendGrid/SMTP (Live)']
        : ['OpenAI API', 'Mock Email System']
    },
    { 
      id: 'ops', 
      name: 'Operations Agent', 
      role: 'Fulfillment',
      subscriptions: ['order.paid', 'inventory.low'],
      capabilities: ['Fulfill Orders', 'Track Shipments', 'Manage Returns'],
      externalEndpoints: ['FedEx API (Simulated)', 'UPS API (Simulated)']
    },
    { 
      id: 'analytics', 
      name: 'Analytics Agent', 
      role: 'Data Analysis',
      subscriptions: ['*'],
      capabilities: ['Generate Reports', 'Calculate Profit', 'Predict Trends'],
      externalEndpoints: ['Internal Database']
    }
  ];
  res.json(agentMetadata);
});

app.get('/api/logs', async (req, res) => {
  try {
    const logs = await db.getRecentLogs(50);
    res.json(logs);
  } catch (error: any) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ error: "Failed to fetch logs", details: error.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await db.getProducts();
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await db.getOrders();
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.get('/api/ads', async (req, res) => {
  console.log("GET /api/ads called");
  try {
    const ads = await db.getCampaigns();
    res.json(ads);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch ads" });
  }
});

app.post('/api/ceo/chat', async (req, res) => {
  console.log('[API] /api/ceo/chat called with body:', req.body);
  const { message, mode } = req.body;
  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  try {
    // mode: 'simulation' for sim data, undefined/null for live data
    const response = await agents.ceo.chat(message, mode);
    res.json({ response });
  } catch (error: any) {
    console.error('[API] /api/ceo/chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ready', async (req, res) => {
  try {
    // Check: ensure AI client can be constructed
    try {
      openAIService.getClient();
    } catch (err: any) {
      console.warn('Ready check: openAI client not ready', err && err.message ? err.message : String(err));
      return res.status(503).json({ ready: false, reason: 'AI client not ready' });
    }
    return res.json({ ready: true });
  } catch (err: any) {
    return res.status(500).json({ ready: false, error: err.message });
  }
});

app.get('/api/db/topics', async (req, res) => {
  try {
    const dbSource = req.query.db as string | undefined;
    const topics = await db.getTopics(dbSource);
    res.json(topics);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch topics" });
  }
});

app.get('/api/db/table/:table', async (req, res) => {
  const { table } = req.params;
  const { topic, db: dbSource } = req.query;
  
  try {
    let data: any[] = [];
    if (table === 'events') {
      data = await db.getEvents(topic as string, dbSource as string);
    } else if (table === 'products') {
      data = await db.getProducts(dbSource as string);
    } else if (table === 'orders') {
      data = await db.getOrders(dbSource as string);
    } else if (table === 'ads') {
      data = await db.getCampaigns(dbSource as string);
    } else {
      res.status(400).json({ error: "Unknown table" });
      return;
    }
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch ${table}` });
  }
});

// --- Docker Control API ---
app.get('/api/docker/status', async (req, res) => {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  try {
    const { stdout } = await execAsync('docker ps --format "{{.Names}}" --filter name=ds1-db-1');
    const isRunning = stdout.trim() === 'ds1-db-1';
    res.json({ running: isRunning });
  } catch (e) {
    res.json({ running: false });
  }
});

app.post('/api/docker/start', async (req, res) => {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  try {
    await execAsync('docker-compose up -d', { cwd: process.cwd() });
    res.json({ status: 'success', message: 'Database container started' });
  } catch (e: any) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.post('/api/docker/stop', async (req, res) => {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  try {
    await execAsync('docker-compose down', { cwd: process.cwd() });
    res.json({ status: 'success', message: 'Database container stopped' });
  } catch (e: any) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// --- Simulation API ---
app.post('/api/simulation/start', async (req, res) => {
  console.log("Starting simulation flow...");
  
  // Async background task
  simulationService.runSimulationFlow().catch(console.error);

  res.json({ status: 'started', message: 'Simulation running in background.' });
});

app.post('/api/simulation/clear', async (req, res) => {
  console.log("Clearing simulation database...");
  try {
    await simulationService.clearSimulationData();
    res.json({ status: 'success', message: 'Simulation database cleared successfully.' });
  } catch (error: any) {
    console.error('[API] Failed to clear simulation database:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin Panel: http://localhost:${PORT}`);
});

// --- Global error handlers ---
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// --- Keep-alive interval to prevent process exit ---
setInterval(() => {
  // This does nothing but keeps the event loop alive
}, 1000 * 60 * 5); // 5 minutes
