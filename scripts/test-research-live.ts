import dotenv from 'dotenv';
dotenv.config();

// Force file logging
process.env.LOGGING_MODE = 'file';
process.env.DS1_MODE = 'simulation'; // Ensure we write to simulation logs

import path from 'path';
import { Container } from '../src/core/bootstrap/Container.js';
import { ProductResearchAgent } from '../src/agents/ProductResearchAgent.js';

async function run() {
    console.log('--- Starting Real Research Verification ---');

    // Initialize Container
    const configPath = path.join(process.cwd(), 'config', 'bootstrap.sim.yaml');
    const container = new Container(configPath);
    await container.init();

    // Get Agent
    const agent = container.getAgent('product_research_agent') as ProductResearchAgent;
    if (!agent) {
        console.error('Failed to retrieve ProductResearchAgent from container.');
        process.exit(1);
    }

    console.log('Agent retrieved successfully.');

    // Run Research
    const request = {
        request_id: 'req_real_001',
        criteria: {
            category: 'Home Office',
            constraints: {
                budget: 1000,
                timeline: '30d'
            }
        }
    };

    console.log(`Sending Research Request for: ${request.criteria.category}...`);
    
    try {
        await agent.handleResearchRequest(request);
        console.log('--- Research Complete ---');
    } catch (error) {
        console.error('Research failed:', error);
    }
}

run().catch(console.error);
