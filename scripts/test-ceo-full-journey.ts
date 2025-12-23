import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { Container } from '../src/core/bootstrap/Container.js';
import { CEOAgent } from '../src/agents/CEOAgent.js';
import { PostgresAdapter } from '../src/infra/db/PostgresAdapter.js';

async function run() {
    console.log('--- Testing CEO Full Journey Narrative ---');

    // Initialize Container
    const configPath = path.join(process.cwd(), 'config', 'bootstrap.sim.yaml');
    const container = new Container(configPath);
    await container.init();

    // Get Components
    const ceo = container.getAgent('ceo_agent') as CEOAgent;
    const db = (ceo as any).db as PostgresAdapter;

    if (!ceo || !db) {
        console.error('Failed to retrieve components.');
        process.exit(1);
    }

    const requestId = 'req_journey_001';
    const productId = 'prod_winner_99';
    
    // 1. Seed Research Logs (linked to Request ID)
    console.log(`Seeding Research logs for: ${requestId}...`);
    await db.saveActivity({
        entityId: requestId,
        agent: 'ProductResearchAgent',
        action: 'ResearchStarted',
        category: 'Research',
        message: 'Starting research for "Smart Home Devices"',
        timestamp: new Date(Date.now() - 100000)
    });

    await db.saveActivity({
        entityId: requestId,
        agent: 'ProductResearchAgent',
        action: 'ProductFound',
        category: 'Research',
        message: '✅ Found product: Smart Levitating Plant Pot',
        metadata: { productId: productId }, // This links the logs!
        timestamp: new Date(Date.now() - 80000)
    });

    // 2. Seed Supplier Logs (linked to Product ID)
    console.log(`Seeding Supplier logs for: ${productId}...`);
    await db.saveActivity({
        entityId: productId,
        agent: 'SupplierAgent',
        action: 'SourcingStarted',
        category: 'Sourcing',
        message: 'Contacting suppliers on Alibaba for "Smart Levitating Plant Pot"',
        timestamp: new Date(Date.now() - 60000)
    });

    await db.saveActivity({
        entityId: productId,
        agent: 'SupplierAgent',
        action: 'NegotiationSuccess',
        category: 'Sourcing',
        message: 'Secured deal with Shenzhen Tech Co. Unit cost: $12.50 (Target: $15.00)',
        timestamp: new Date(Date.now() - 50000)
    });

    // 3. Seed Marketing Logs (linked to Product ID)
    console.log(`Seeding Marketing logs for: ${productId}...`);
    await db.saveActivity({
        entityId: productId,
        agent: 'MarketingAgent',
        action: 'CampaignLaunch',
        category: 'Marketing',
        message: 'Launched Facebook Ad Campaign "Levitate Your Life"',
        timestamp: new Date(Date.now() - 20000)
    });

    // 4. Ask CEO
    console.log(`Asking CEO about request: ${requestId}...`);
    const narrative = await ceo.askAboutProduct(requestId);
    
    console.log('\n--- CEO Narrative (Expect Full Journey) ---\n');
    console.log(narrative);
    console.log('\n-------------------------------------------\n');
}

run().catch(console.error);
