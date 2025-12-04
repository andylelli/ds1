import { CEOAgent } from './agents/ceoAgent.js';
import { ProductResearchAgent } from './agents/productResearchAgent.js';
import { SupplierAgent } from './agents/supplierAgent.js';
import { StoreBuildAgent } from './agents/storeBuildAgent.js';
import { MarketingAgent } from './agents/marketingAgent.js';
import { CustomerServiceAgent } from './agents/customerServiceAgent.js';
import { OperationsAgent } from './agents/operationsAgent.js';
import { AnalyticsAgent } from './agents/analyticsAgent.js';
import { initDatabase } from './lib/db.js';
import { runProductLifecycle } from './simulation.js';

async function main() {
  console.log("Initializing database...");
  await initDatabase();

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

  console.log("Starting simulation...");
  await runProductLifecycle(agents);
  console.log("Simulation finished.");
}

main().catch(console.error);
