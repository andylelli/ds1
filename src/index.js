import express from 'express';
import { PlannerAgent } from './agents/planner.js';
import { CriticAgent } from './agents/critic.js';
import { MCP_MESSAGE_TYPES } from './mcp/protocol.js';
import { initDatabase } from './lib/db.js';

const app = express();
app.use(express.json());

const planner = new PlannerAgent();
const critic = new CriticAgent();

// Initialize DB connection
initDatabase().catch(console.error);

// Internal helper to route messages to agents
async function routeMessageToAgent(agent, message) {
  // In a real monolith, we might want to capture the output stream
  // For now, we just let the agent write to stdout (logs) and we could capture events if we refactored BaseAgent
  // But for this demo, we will just trigger the handler.
  // Note: BaseAgent writes results to stdout. In a web context, we'd want to capture that.
  // For simplicity, we assume agents are background workers here, or we'd need to refactor BaseAgent to return values.
  
  // Hack: We will attach a temporary listener to capture the result for the HTTP response
  return new Promise((resolve) => {
    const originalSendResult = agent.sendResult.bind(agent);
    agent.sendResult = (id, result) => {
      agent.sendResult = originalSendResult; // Restore
      resolve(result);
    };
    agent.handleMessage(message);
  });
}

app.post('/api/plan', async (req, res) => {
  const { goal } = req.body;
  const message = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: MCP_MESSAGE_TYPES.PLAN_REQUEST,
    params: { goal }
  };
  
  const result = await routeMessageToAgent(planner, message);
  res.json(result);
});

app.post('/api/critique', async (req, res) => {
  const { task, output } = req.body;
  const message = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: MCP_MESSAGE_TYPES.CRITIQUE_REQUEST,
    params: { task, output }
  };

  const result = await routeMessageToAgent(critic, message);
  res.json(result);
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
