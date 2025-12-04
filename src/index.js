/**
 * Main Application Entry Point
 * 
 * What it does:
 * - Initializes the Express.js web server.
 * - Instantiates all specific agents (CEO, Research, Supplier, etc.).
 * - Connects to the database.
 * - Sets up API routes to dispatch tasks to agents via the MCP protocol.
 * 
 * Interacts with:
 * - All Agent classes in /src/agents/
 * - Database module (/src/lib/db.js)
 * - MCP Protocol definitions (/src/mcp/protocol.js)
 */
import express from 'express';
import path from 'path';
import { CEOAgent } from './agents/ceoAgent.js';
import { ProductResearchAgent } from './agents/productResearchAgent.js';
import { SupplierAgent } from './agents/supplierAgent.js';
import { StoreBuildAgent } from './agents/storeBuildAgent.js';
import { MarketingAgent } from './agents/marketingAgent.js';
import { CustomerServiceAgent } from './agents/customerServiceAgent.js';
import { OperationsAgent } from './agents/operationsAgent.js';
import { AnalyticsAgent } from './agents/analyticsAgent.js';
import { MCP_MESSAGE_TYPES } from './mcp/protocol.js';
import { initDatabase, switchDatabaseMode } from './lib/db.js';
import { config } from './lib/config.js';

const app = express();
app.use(express.json());
app.use(express.static('public')); // Serve admin panel

// Initialize Agents
const agents = {
  ceo: new CEOAgent(),
  research: new ProductResearchAgent(),
  supplier: new SupplierAgent(),
  store: new StoreBuildAgent(),
  marketing: new MarketingAgent(),
  support: new CustomerServiceAgent(),
  ops: new OperationsAgent(),
  analytics: new AnalyticsAgent()
};

// Initialize DB connection
initDatabase().catch(console.error);

// --- Configuration API ---
app.get('/api/config', (req, res) => {
  res.json(config.getAll());
});

app.post('/api/config', async (req, res) => {
  const newConfig = req.body;
  
  // Check if DB mode changed
  const oldDbMode = config.get('dbMode');
  config.update(newConfig);
  
  if (newConfig.dbMode && newConfig.dbMode !== oldDbMode) {
    console.log(`[Config] Switching DB mode to ${newConfig.dbMode}...`);
    await switchDatabaseMode(newConfig.dbMode);
  }

  res.json({ status: 'ok', config: config.getAll() });
});
// -------------------------

// Internal helper to route messages to agents
async function routeMessageToAgent(agent, message) {
  return new Promise((resolve) => {
    const originalSendResult = agent.sendResult.bind(agent);
    agent.sendResult = (id, result) => {
      agent.sendResult = originalSendResult; // Restore
      resolve(result);
    };
    agent.handleMessage(message);
  });
}

// Chat with CEO Endpoint
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const response = await agents.ceo.chat(message);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generic Agent Endpoint
app.post('/api/agent/:name/:action', async (req, res) => {
  const { name, action } = req.params;
  const agent = agents[name];

  if (!agent) {
    return res.status(404).json({ error: `Agent '${name}' not found` });
  }

  // Determine message type based on action
  let method = MCP_MESSAGE_TYPES.TASK_REQUEST;
  if (action === 'plan') method = MCP_MESSAGE_TYPES.PLAN_REQUEST;
  if (action === 'critique') method = MCP_MESSAGE_TYPES.CRITIQUE_REQUEST;

  const message = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: method,
    params: req.body // Pass body directly as params
  };

  try {
    const result = await routeMessageToAgent(agent, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available Agents:', Object.keys(agents).join(', '));
});
