import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { Container } from '../src/core/bootstrap/Container.js';
import { CEOAgent } from '../src/agents/CEOAgent.js';
import { PostgresAdapter } from '../src/infra/db/PostgresAdapter.js';

async function run() {
    console.log('--- Testing CEO Workflow Awareness ---');

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

    const requestId = 'req_workflow_001';
    
    // Seed Logs representing a partial workflow (Stalled at Step 5: Gating)
    console.log(`Seeding logs for: ${requestId}...`);
    
    const steps = [
        { action: 'Step 0: Dependencies', msg: 'Dependencies loaded.' },
        { action: 'Step 1: Brief', msg: 'Research brief created.' },
        { action: 'Step 2: Learnings', msg: 'Ingested prior learnings.' },
        { action: 'Step 3: Signals', msg: 'Collected 15 signals.' },
        { action: 'Step 4: Themes', msg: 'Generated 5 themes.' },
        // We stop here, simulating a stall or failure at Step 5
        { action: 'Step 5: Gating', msg: 'Gating themes... Failed to gate.' }
    ];

    for (let i = 0; i < steps.length; i++) {
        await db.saveActivity({
            entityId: requestId,
            agent: 'ProductResearchAgent',
            action: steps[i].action,
            category: 'Research',
            message: steps[i].msg,
            timestamp: new Date(Date.now() - (10000 - (i * 1000)))
        });
    }

    // 2. Ask CEO
    console.log(`Asking CEO about request: ${requestId}...`);
    const narrative = await ceo.askAboutProduct(requestId);
    
    console.log('\n--- CEO Narrative (Expect Workflow References) ---\n');
    console.log(narrative);
    console.log('\n--------------------------------------------------\n');
}

run().catch(console.error);
