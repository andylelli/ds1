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
import crypto from 'crypto';
import { openAIService } from './infra/ai/OpenAIService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import yaml from 'js-yaml';

// New Container Import
import { Container } from './core/bootstrap/Container.js';
import { PostgresAdapter } from './infra/db/PostgresAdapter.js';
import { configService } from './infra/config/ConfigService.js';

import { SimulationService } from './core/services/SimulationService.js';
import { ResearchStagingService } from './core/services/ResearchStagingService.js';
import { CEOAgent } from './agents/CEOAgent.js';
import { createStagingRoutes } from './api/staging-routes.js';
import { createBriefRoutes } from './api/brief-routes.js';
import { ActivityLogService } from './core/services/ActivityLogService.js';
import { createActivityRoutes } from './api/activity-routes.js';

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

// --- Initialize Container ---
const mode = process.env.DS1_MODE || 'simulation';
const configFileName = mode === 'live' ? 'bootstrap.live.yaml' : 'bootstrap.sim.yaml';
console.log(`Initializing Container in ${mode} mode using ${configFileName}`);

const configPath = path.join(process.cwd(), 'config', configFileName);
const container = new Container(configPath);

// We need to wrap initialization in an async function
(async () => {
  try {
    await container.init();
    
    // Retrieve dependencies from Container
    // Note: In a pure DI world, we wouldn't pull these out manually, 
    // but we are bridging to the existing Express app structure.
    
    // We know the persistence is PostgresAdapter because of our config
    // Casting to PostgresAdapter to access specific methods like getPool() if needed
    // In the future, we should avoid casting and use the interface.
    const db = container.getService('db') as PostgresAdapter || new PostgresAdapter(); 
    const eventBus = container.getService('eventBus') as any; // Cast to any or EventBusPort
    
    // Initialize Services
    const activityLog = new ActivityLogService(db.getPool());
    const stagingService = new ResearchStagingService(db.getPool());

    // Retrieve Agents
    const agents = {
      ceo: new CEOAgent(db, container.getEventBus(), container.getService('ai_service'), stagingService),
      research: container.getAgent('product_research_agent'),
      supplier: container.getAgent('supplier_agent'),
      store: container.getAgent('store_build_agent'),
      marketing: container.getAgent('marketing_agent'),
      support: container.getAgent('customer_service_agent'),
      ops: container.getAgent('operations_agent'),
      analytics: container.getAgent('analytics_agent')
    };

    // Initialize Services
    const simulationService = new SimulationService(db, container.getEventBus(), agents, activityLog, stagingService);

    // --- Configuration API ---
    app.get('/api/config', (req, res) => {
      res.json({
        mode: mode,
        useSimulatedEndpoints: mode === 'simulation',
        ...container.getConfig()
      });
    });

    app.post('/api/config', (req, res) => {
      try {
        const { services } = req.body;
        if (!services) {
           res.status(400).json({ error: "Missing services config" });
           return;
        }

        // Read current YAML
        // configPath is defined in the outer scope
        const currentConfig = yaml.load(fs.readFileSync(configPath, 'utf8')) as any;
        
        // Update services
        if (!currentConfig.bootstrap) currentConfig.bootstrap = {};
        if (!currentConfig.bootstrap.services) currentConfig.bootstrap.services = {};
        
        currentConfig.bootstrap.services = {
            ...currentConfig.bootstrap.services,
            ...services
        };

        // Write back
        fs.writeFileSync(configPath, yaml.dump(currentConfig));
        
        console.log(`[Config] Updated configuration in ${configPath}`);
        res.json({ status: 'ok', message: 'Configuration saved' });
      } catch (e: any) {
        console.error("Failed to save config:", e);
        res.status(500).json({ error: "Failed to save config" });
      }
    });

    // --- Data APIs ---
    app.get('/api/agents', (req, res) => {
      // Dynamic metadata generation based on container config could go here
      // For now, keeping the static list but we could enhance it later
      const config = container.getConfig();
      // ... (We can keep the existing metadata logic or simplify it)
      // For safety, let's keep the existing response structure but maybe simplify the logic
      // Since we are refactoring, let's just return the list of active agents from the container
      
      const agentList = config.agents?.agents.map(a => {
          const instance = container.getAgent(a.id);
          // Check if instance has getMode method (it should if it extends BaseAgent)
          const mode = (instance as any)?.getMode ? (instance as any).getMode() : 'unknown';
          
          // Debug log
          console.log(`API Agent Check: ${a.id} -> Mode: ${mode}`);

          return {
              id: a.id,
              name: a.class, // simplified for now
              role: 'Agent',
              mode: mode,
              status: 'active', // Default to active since they are initialized
              subscriptions: [],
              capabilities: [],
              externalEndpoints: []
          };
      }) || [];
      
      res.json(agentList);
    });

    // Register Routes
    app.use('/api/staging', createStagingRoutes(db.getPool(), container.getEventBus()));
    app.use('/api/activity', createActivityRoutes(activityLog));
    app.use('/api/briefs', createBriefRoutes(db));

    app.get('/api/logs', async (req, res) => {
      try {
        const logs = await db.getRecentLogs(50);
        res.json(logs);
      } catch (error: any) {
        console.error("Error fetching logs:", error);
        res.status(500).json({ error: "Failed to fetch logs", details: error.message });
      }
    });

    app.get('/api/logs/errors', async (req, res) => {
      try {
        const logs = await db.getErrorLogs(50);
        res.json(logs);
      } catch (error: any) {
        console.error("Error fetching error logs:", error);
        res.status(500).json({ error: "Failed to fetch error logs", details: error.message });
      }
    });

    app.post('/api/logs/clear', async (req, res) => {
        try {
            await db.clearLogs();
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: "Failed to clear logs" });
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

    // --- Staging API Routes ---
    app.use('/api/staging', createStagingRoutes(db.getPool(), eventBus));

    // --- Activity Log API Routes ---
    app.use('/api/activity', createActivityRoutes(activityLog));

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

    // --- Live API ---
    app.post('/api/research', async (req, res) => {
        const { category } = req.body;
        if (!category) {
            res.status(400).json({ error: 'Category is required' });
            return;
        }

        const requestId = crypto.randomUUID();
        const eventBus = container.getEventBus();
        
        await eventBus.publish('OpportunityResearch.Requested', {
            request_id: requestId,
            criteria: {
                category,
                priority: 'high'
            }
        });

        res.json({ 
            status: 'accepted', 
            requestId, 
            message: `Research requested for: ${category}` 
        });
    });

    // --- Simulation API ---
    app.post('/api/simulation/start', async (req, res) => {
      if (mode !== 'simulation') {
        res.status(403).json({ error: 'Simulation endpoints are only available in simulation mode.' });
        return;
      }
      const { category } = req.body;
      const topic = category || 'Fitness'; // Default if missing
      
      console.log(`Starting simulation flow (Research Phase) for topic: ${topic}...`);
      
      try {
        const requestId = await simulationService.runResearchPhase(topic);
        res.json({ status: 'started', requestId, message: `Simulation research phase started for: ${topic}` });
      } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to start simulation' });
      }
    });

    app.post('/api/simulation/approve', async (req, res) => {
      if (mode !== 'simulation') {
        res.status(403).json({ error: 'Simulation endpoints are only available in simulation mode.' });
        return;
      }
      const { itemId } = req.body;
      if (!itemId) {
          res.status(400).json({ error: 'itemId is required' });
          return;
      }

      console.log(`Approving item ${itemId} and starting Launch Phase...`);
      
      // Update status in DB first
      try {
          await stagingService.approveItem(itemId, 'User', 'Approved via UI');
      } catch (e) {
          console.error("Failed to approve item in DB:", e);
          res.status(500).json({ error: "Failed to approve item" });
          return;
      }

      // Async background task
      simulationService.runLaunchPhase(itemId).catch(console.error);

      res.json({ status: 'started', message: 'Simulation launch phase running in background.' });
    });

    app.post('/api/simulation/loop/start', (req, res) => {
      if (mode !== 'simulation') return res.status(403).json({ error: 'Simulation mode only' });
      const { interval } = req.body;
      simulationService.startLoop(interval || 10000);
      res.json({ status: 'success', message: 'Continuous simulation loop started' });
    });

    app.post('/api/simulation/loop/stop', (req, res) => {
      if (mode !== 'simulation') return res.status(403).json({ error: 'Simulation mode only' });
      simulationService.stopLoop();
      res.json({ status: 'success', message: 'Continuous simulation loop stopped' });
    });

    app.post('/api/simulation/clear', async (req, res) => {
      if (mode !== 'simulation') {
        res.status(403).json({ error: 'Simulation endpoints are only available in simulation mode.' });
        return;
      }
      console.log("Clearing simulation database...");
      try {
        await simulationService.clearSimulationData();
        res.json({ status: 'success', message: 'Simulation database cleared successfully.' });
      } catch (error: any) {
        console.error('[API] Failed to clear simulation database:', error);
        res.status(500).json({ status: 'error', message: error.message });
      }
    });

    app.get('/api/simulation/status', (req, res) => {
        res.json({
            tickCount: simulationService.getTickCount(),
            isRunning: simulationService.getIsRunning()
        });
    });

    // Start Server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Control Panel: http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('Failed to initialize container:', err);
    process.exit(1);
  }
})();

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
