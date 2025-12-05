import express from 'express';
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
import { MockAdsAdapter } from './infra/ads/MockAdsAdapter.js';
import { configService } from './infra/config/ConfigService.js';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static('public')); // Serve admin panel

// Initialize Adapters
const db = new PostgresAdapter();
const shopAdapter = new MockShopAdapter();
const adsAdapter = new MockAdsAdapter();

// Initialize Agents
const agents = {
  ceo: new CEOAgent(db),
  research: new ProductResearchAgent(db),
  supplier: new SupplierAgent(db),
  store: new StoreBuildAgent(db, shopAdapter),
  marketing: new MarketingAgent(db, adsAdapter),
  support: new CustomerServiceAgent(db),
  ops: new OperationsAgent(db),
  analytics: new AnalyticsAgent(db)
};

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

// --- Simulation API ---
app.post('/api/simulation/start', async (req, res) => {
  // TODO: Implement Simulation Service
  // runProductLifecycle(agents, db).catch(console.error);
  
  // For now, just trigger a simple test flow
  console.log("Starting simulation flow...");
  
  // Async background task
  (async () => {
      try {
        // 1. Research
        const researchResult = await agents.research.findWinningProducts({ category: 'Fitness' });
        if (!researchResult || !researchResult.products) {
            console.error("No products found");
            return;
        }
        const product = researchResult.products[0];
        await db.saveProduct({ ...product, price: 29.99 }); // Save initial product
        
        // 2. Source
        await agents.supplier.findSuppliers({ product_id: product.id });
        
        // 3. Build Store
        const page = await agents.store.createProductPage({ product_data: product });
        
        // 4. Marketing
        await agents.marketing.createAdCampaign({ platform: 'Facebook', budget: 100, product: product.name });
        
        // 5. Traffic (Simulated)
        // ...
        
        console.log("Simulation flow completed.");
      } catch (e) {
          console.error("Simulation failed:", e);
      }
  })();

  res.json({ status: 'started', message: 'Simulation running in background.' });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin Panel: http://localhost:${PORT}`);
});
