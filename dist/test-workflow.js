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
        await eventBus.subscribe('PRODUCT_FOUND', 'TestObserver', async (payload) => {
            console.log(`[👀 OBSERVER] Product Found: ${payload.product.name}`);
        });
        await eventBus.subscribe('PRODUCT_APPROVED', 'TestObserver', async (payload) => {
            console.log(`[✅ OBSERVER] Product APPROVED: ${payload.product.name} (Reason: ${payload.reason})`);
        });
        // 3. Trigger the Workflow
        console.log("--- Triggering RESEARCH_REQUESTED ---");
        await eventBus.publish('RESEARCH_REQUESTED', 'RESEARCH_REQUESTED', { category: 'Fitness' });
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
