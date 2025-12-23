import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { Container } from '../src/core/bootstrap/Container.js';
import { CEOAgent } from '../src/agents/CEOAgent.js';

async function run() {
    console.log('--- Testing CEO Narrative ---');

    // Initialize Container
    const configPath = path.join(process.cwd(), 'config', 'bootstrap.sim.yaml');
    const container = new Container(configPath);
    await container.init();

    // Get Agent
    const ceo = container.getAgent('ceo_agent') as CEOAgent;
    if (!ceo) {
        console.error('Failed to retrieve CEOAgent from container.');
        process.exit(1);
    }

    const requestId = 'req_real_001';
    console.log(`Asking CEO about request: ${requestId}...`);
    
    const narrative = await ceo.askAboutProduct(requestId);
    console.log('\n--- CEO Narrative ---\n');
    console.log(narrative);
    console.log('\n---------------------\n');
}

run().catch(console.error);
