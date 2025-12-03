import { MCPServer } from '../mcp/server.js';

const server = new MCPServer();

// Register a tool
server.registerTool('echo', async ({ message }) => {
  server.log('info', `Echoing message: ${message}`);
  return { original: message, echoed: message };
});

// Register a tool for "AT" (Automation Task - Placeholder)
server.registerTool('process_order', async ({ orderId }) => {
  server.log('info', `Processing order: ${orderId}`);
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 500));
  return { status: 'processed', orderId, timestamp: new Date().toISOString() };
});

// Register a resource
server.registerResource('internal://status', async () => {
  return {
    uptime: process.uptime(),
    status: 'healthy',
    activeAgents: 1
  };
});

// Start the server
server.start().catch(console.error);
