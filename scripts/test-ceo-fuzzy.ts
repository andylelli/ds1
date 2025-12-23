import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { Container } from '../src/core/bootstrap/Container.js';
import { CEOAgent } from '../src/agents/CEOAgent.js';
import { PostgresAdapter } from '../src/infra/db/PostgresAdapter.js';

async function run() {
    console.log('--- Testing CEO Fuzzy Search ---');

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

    const requestId = 'req_fuzzy_001';
    const productId = 'prod_fuzzy_99';
    const productName = 'Super Ergonomic Gaming Chair';
    
    // 1. Seed Product (so we can find it by name)
    console.log(`Seeding Product: "${productName}"...`);
    // We need to insert into products table directly or use saveProduct if available
    // PostgresAdapter has saveProduct but it might not be exposed on the interface fully or we can use raw query
    // Let's use saveProduct if possible, or mock it via direct SQL if needed.
    // Actually saveProduct is on PersistencePort.
    
    await db.saveProduct({
        id: productId,
        name: productName,
        price: 299,
        description: 'Best chair ever',
        _db: 'sim' // Force sim db
    });

    // 2. Seed Logs (linked)
    console.log(`Seeding Logs...`);
    await db.saveActivity({
        entityId: requestId,
        agent: 'ProductResearchAgent',
        action: 'ProductFound',
        category: 'Research',
        message: `✅ Found product: ${productName}`,
        metadata: { productId: productId },
        timestamp: new Date(Date.now() - 100000)
    });

    await db.saveActivity({
        entityId: productId,
        agent: 'MarketingAgent',
        action: 'CampaignLaunch',
        category: 'Marketing',
        message: 'Launched Ad Campaign for Chair',
        timestamp: new Date(Date.now() - 50000)
    });

    // 3. Ask CEO using partial name
    const query = "Gaming Chair"; // Partial match
    console.log(`Asking CEO about: "${query}"...`);
    
    const narrative = await ceo.askAboutProduct(query);
    
    console.log('\n--- CEO Narrative (Expect Success via Fuzzy Match) ---\n');
    console.log(narrative);
    console.log('\n----------------------------------------------------\n');
}

run().catch(console.error);
