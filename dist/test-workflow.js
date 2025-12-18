import dotenv from 'dotenv';
import path from 'path';
import { Container } from './core/bootstrap/Container.js';
// Load env vars
dotenv.config();
async function main() {
    try {
        console.log("--- Starting Workflow Test ---");
        // 1. Initialize Container
        const configPath = path.join(process.cwd(), 'config', 'bootstrap.yaml');
        const container = new Container(configPath);
        await container.init();
        const eventBus = container.getEventBus();
        // 2. Subscribe to observe the chain
        await eventBus.subscribe('Product.Found', 'TestObserver', async (event) => {
            console.log(`[👀 OBSERVER] Product Found: ${event.payload.product.name}`);
        });
        await eventBus.subscribe('Product.Approved', 'TestObserver', async (event) => {
            console.log(`[✅ OBSERVER] Product APPROVED: ${event.payload.product.name} (Reason: ${event.payload.reason})`);
        });
        // 3. Trigger the Workflow
        console.log("--- Triggering RESEARCH_REQUESTED ---");
        await eventBus.publish('OpportunityResearch.Requested', { request_id: 'test-1', criteria: { category: 'Fitness' } });
        // 4. Keep alive for a bit to allow async processing
        setTimeout(() => {
            console.log("--- Test Complete (Timeout) ---");
            process.exit(0);
        }, 15000); // 15 seconds should be enough for the chain
    }
    catch (error) {
        console.error('Failed to run workflow test:', error);
        process.exit(1);
    }
}
main();
