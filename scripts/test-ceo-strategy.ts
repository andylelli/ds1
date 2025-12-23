import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { Container } from '../src/core/bootstrap/Container.js';
import { CEOAgent } from '../src/agents/CEOAgent.js';
import { PostgresAdapter } from '../src/infra/db/PostgresAdapter.js';
import { CurrentStrategy } from '../src/core/domain/types/StrategyProfile.js';

async function run() {
    console.log('--- Testing CEO Strategy Narrative ---');

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

    const requestId = 'req_strat_test_001';
    
    // 1. Seed Logs showing Misalignment
    // We simulate a request for "Industrial Machinery" which is NOT in the allowed categories
    // Allowed: Fitness, Home, Pet, Gadgets, General
    
    console.log(`Seeding logs for: ${requestId}...`);
    await db.saveActivity({
        entityId: requestId,
        agent: 'ProductResearchAgent',
        action: 'ResearchStarted',
        category: 'Research',
        message: 'Starting research for "Industrial Heavy Machinery"',
        timestamp: new Date(Date.now() - 10000)
    });

    await db.saveActivity({
        entityId: requestId,
        agent: 'ProductResearchAgent',
        action: 'StrategyCheck',
        category: 'Strategy',
        message: 'Checking alignment with Strategy Profile...',
        timestamp: new Date(Date.now() - 8000)
    });

    // Simulate a Misalignment Error
    await db.saveActivity({
        entityId: requestId,
        agent: 'ProductResearchAgent',
        action: 'Pipeline Failed',
        category: 'Strategy',
        message: 'Strategy Misalignment: Category "Industrial" aligned poorly with allowed categories.',
        timestamp: new Date(Date.now() - 5000)
    });

    // 2. Ask CEO
    console.log(`Asking CEO about request: ${requestId}...`);
    const narrative = await ceo.askAboutProduct(requestId);
    
    console.log('\n--- CEO Narrative (Expect Strategy Explanation) ---\n');
    console.log(narrative);
    console.log('\n---------------------------------------------------\n');
}

run().catch(console.error);
