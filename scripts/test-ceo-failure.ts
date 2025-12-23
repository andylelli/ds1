import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { Container } from '../src/core/bootstrap/Container.js';
import { CEOAgent } from '../src/agents/CEOAgent.js';
import { PostgresAdapter } from '../src/infra/db/PostgresAdapter.js';

async function run() {
    console.log('--- Testing CEO Failure Narrative ---');

    // Initialize Container
    const configPath = path.join(process.cwd(), 'config', 'bootstrap.sim.yaml');
    const container = new Container(configPath);
    await container.init();

    // Get Components
    const ceo = container.getAgent('ceo_agent') as CEOAgent;
    // Access db from agent (it's protected, so we cast to any)
    const db = (ceo as any).db as PostgresAdapter;

    if (!ceo || !db) {
        console.error('Failed to retrieve components.');
        process.exit(1);
    }

    const requestId = 'req_fail_test_001';
    
    // 1. Seed Failed Logs
    console.log(`Seeding failed logs for: ${requestId}...`);
    await db.saveActivity({
        entityId: requestId,
        agent: 'ProductResearchAgent',
        action: 'ResearchStarted',
        category: 'Research',
        message: 'Starting research for "Wireless Chargers"',
        timestamp: new Date(Date.now() - 10000)
    });

    await db.saveActivity({
        entityId: requestId,
        agent: 'ProductResearchAgent',
        action: 'SearchExecuted',
        category: 'Research',
        message: 'Searching Google Trends...',
        timestamp: new Date(Date.now() - 8000)
    });

    // Simulate a Rate Limit Error
    await db.saveActivity({
        entityId: requestId,
        agent: 'ProductResearchAgent',
        action: 'Error',
        category: 'System',
        message: '429 Too Many Requests: You have exceeded your quota.',
        timestamp: new Date(Date.now() - 5000)
    });

    // 2. Ask CEO
    console.log(`Asking CEO about request: ${requestId}...`);
    const narrative = await ceo.askAboutProduct(requestId);
    
    console.log('\n--- CEO Narrative (Expect Failure Explanation) ---\n');
    console.log(narrative);
    console.log('\n--------------------------------------------------\n');
}

run().catch(console.error);
