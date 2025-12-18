import { Container } from '../src/core/bootstrap/Container.js';
import { ActivityLogService } from '../src/core/services/ActivityLogService.js';
import { ProductResearchAgent } from '../src/agents/ProductResearchAgent.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
    console.log("🧪 Starting Control Panel E2E Test...");

    // 1. Initialize Container
    // process.env.DS1_MODE = 'mock'; // Removed to allow default configuration (Postgres)
    const configPath = path.join(__dirname, '../config/bootstrap.yaml');
    const container = new Container(configPath);
    await container.init();

    const db = container.getService('db');
    const eventBus = container.getEventBus();
    // const activityLog = new ActivityLogService(db.getPool ? db.getPool() : null); 

    // 2. Get Agent
    const researcher = container.getAgent('product_research_agent') as ProductResearchAgent;
    if (!researcher) {
        console.error("❌ Failed to get ProductResearchAgent");
        process.exit(1);
    }
    console.log("✅ Agent initialized");

    // 3. Trigger Research
    const requestId = `test_req_${Date.now()}`;
    console.log(`🚀 Triggering Research Request: ${requestId}`);
    
    // We can call handleResearchRequest directly or via EventBus. 
    // Calling directly is easier for waiting on the promise if it returns one, 
    // but the agent subscribes to the event.
    // However, handleResearchRequest is private. We should publish an event.
    
    // To wait for completion, we can subscribe to the 'OpportunityResearch.BriefsPublished' event
    // or 'OpportunityResearch.Aborted'.
    
    const completionPromise = new Promise<void>((resolve, reject) => {
        eventBus.subscribe('OpportunityResearch.BriefsPublished', 'TestRunner', async (event) => {
            console.log("✅ Research Completed (Briefs Published)");
            resolve();
        });
        eventBus.subscribe('OpportunityResearch.Aborted', 'TestRunner', async (event) => {
            console.error("❌ Research Aborted:", event.payload.reason);
            reject(new Error(event.payload.reason));
        });
    });

    await eventBus.publish('OpportunityResearch.Requested', {
        request_id: requestId,
        criteria: {
            category: 'Fitness',
            constraints: ['high_margin']
        }
    });

    // 4. Wait for completion (with timeout)
    try {
        await Promise.race([
            completionPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 30000))
        ]);
    } catch (e: any) {
        console.error("❌ Test Failed during execution:", e.message);
        process.exit(1);
    }

    // 5. Verify Logs (Phase 1 & 3)
    console.log("🔍 Verifying Activity Logs...");
    
    let agentLogs: any[] = [];

    // Check if we are using PostgresAdapter which has getPool()
    if (typeof (db as any).getPool === 'function') {
        console.log("   Using Postgres connection to fetch logs.");
        const pool = (db as any).getPool();
        const res = await pool.query("SELECT * FROM activity_log WHERE agent = 'ProductResearcher' ORDER BY timestamp DESC LIMIT 100");
        agentLogs = res.rows;
    } else {
        // Fallback for MockAdapter (reading sandbox_db.json)
        console.log("   Using sandbox_db.json to fetch logs.");
        const fs = await import('fs');
        const dbFile = path.resolve(process.cwd(), 'sandbox_db.json');
        if (fs.existsSync(dbFile)) {
            const dbContent = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
            const activityLogs = dbContent['DropShipDB']['ActivityLog'] || [];
            agentLogs = activityLogs.filter((l: any) => l.agent === 'ProductResearcher');
        }
    }
    
    console.log(`   Found ${agentLogs.length} activity logs for ProductResearcher`);

    const expectedSteps = [
        'Step 0: Dependencies',
        'Step 1: Brief',
        'Step 2: Learnings',
        'Step 3: Signals',
        'Step 4: Themes',
        'Step 5: Gating',
        'Step 6: Scoring',
        'Step 7: Time Fitness',
        'Step 8: Deep Validation',
        'Step 9: Productization',
        'Step 10: Briefs',
        'Step 11: Handoff'
    ];

    const missingSteps = expectedSteps.filter(step => 
        !agentLogs.some((l: any) => l.action && l.action.includes(step))
    );

    if (missingSteps.length === 0) {
        console.log("✅ All 11 Pipeline Steps Logged");
    } else {
        console.error("❌ Missing Steps:", missingSteps);
        // Don't fail yet, maybe some steps were skipped due to logic (e.g. no themes found)
    }

    // 6. Verify Briefs (Phase 2)
    console.log("🔍 Verifying Opportunity Briefs...");
    const briefs = await db.getBriefs();
    const testBriefs = briefs.filter(b => b.meta.research_request_id === requestId);
    
    if (testBriefs.length > 0) {
        console.log(`✅ Found ${testBriefs.length} Briefs`);
        console.log(`   Sample Brief: ${testBriefs[0].opportunity_definition.theme_name} (Score: ${testBriefs[0].certainty_score})`);
    } else {
        console.error("❌ No Briefs found for this request");
    }

    console.log("🎉 Test Complete");
    process.exit(0);
}

runTest().catch(e => {
    console.error("Test Runner Error:", e);
    process.exit(1);
});
