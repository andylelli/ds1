import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;
async function runQA(expectedMode) {
    console.log(`\n🔍 STARTING QA AUTOMATION FOR: [${expectedMode.toUpperCase()} MODE]`);
    console.log('==================================================');
    // --- 0. Static Analysis (Sidebar Check) ---
    console.log('\n[0] Static Analysis: Checking Sidebar Implementation...');
    const publicDir = path.join(__dirname, '../public');
    const htmlFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));
    let sidebarErrors = 0;
    for (const file of htmlFiles) {
        const content = fs.readFileSync(path.join(publicDir, file), 'utf-8');
        if (content.includes('id="sidebar-container"')) {
            const hasScript = content.includes('src="sidebar.js"') || content.includes('src="/sidebar.js"');
            const callsInit = content.includes('initSidebar()');
            if (!hasScript) {
                console.error(`❌ ${file}: Missing <script src="sidebar.js">`);
                sidebarErrors++;
            }
            if (!callsInit) {
                console.error(`❌ ${file}: Missing initSidebar() call`);
                sidebarErrors++;
            }
            if (hasScript && callsInit) {
                console.log(`✅ ${file}: Sidebar configured correctly`);
            }
        }
        else {
            console.log(`ℹ️ ${file}: No sidebar container found (Skipping check)`);
        }
    }
    if (sidebarErrors > 0) {
        console.error(`\n❌ Static Analysis Failed: ${sidebarErrors} sidebar configuration errors found.`);
        process.exit(1);
    }
    // --- 1. Configuration & Sidebar Logic ---
    console.log('\n[1] Checking Configuration & Sidebar Logic...');
    try {
        const configRes = await fetch(`${API_URL}/config`);
        const config = await configRes.json();
        if (config.mode !== expectedMode) {
            throw new Error(`CRITICAL: Server is in '${config.mode}' mode, expected '${expectedMode}'`);
        }
        console.log(`✅ Server Mode: ${config.mode}`);
        // Verify Sidebar Logic (based on config)
        if (expectedMode === 'simulation') {
            if (config.useSimulatedEndpoints !== true)
                console.error('❌ Config mismatch: useSimulatedEndpoints should be true in Sim mode');
            else
                console.log('✅ Sidebar Config: Simulation options enabled');
        }
        else {
            if (config.useSimulatedEndpoints !== false)
                console.error('❌ Config mismatch: useSimulatedEndpoints should be false in Live mode');
            else
                console.log('✅ Sidebar Config: Simulation options disabled (Correct)');
        }
    }
    catch (e) {
        console.error('❌ Config check failed:', e.message);
        process.exit(1);
    }
    // --- 2. Simulation Controls ---
    console.log('\n[2] Testing Simulation Controls...');
    // Test Start
    const startRes = await fetch(`${API_URL}/simulation/start`, { method: 'POST' });
    if (expectedMode === 'simulation') {
        if (startRes.status === 200)
            console.log('✅ /simulation/start: Allowed (200 OK)');
        else
            console.error(`❌ /simulation/start: Failed (${startRes.status})`);
    }
    else {
        if (startRes.status === 403)
            console.log('✅ /simulation/start: Blocked (403 Forbidden) - Correct for Live Mode');
        else
            console.error(`❌ /simulation/start: Should be 403, got ${startRes.status}`);
    }
    // Test Clear
    const clearRes = await fetch(`${API_URL}/simulation/clear`, { method: 'POST' });
    if (expectedMode === 'simulation') {
        if (clearRes.status === 200)
            console.log('✅ /simulation/clear: Allowed (200 OK)');
        else
            console.error(`❌ /simulation/clear: Failed (${clearRes.status})`);
    }
    else {
        if (clearRes.status === 403)
            console.log('✅ /simulation/clear: Blocked (403 Forbidden) - Correct for Live Mode');
        else
            console.error(`❌ /simulation/clear: Should be 403, got ${clearRes.status}`);
    }
    // --- 3. Business Data Endpoints ---
    console.log('\n[3] Testing Business Data Endpoints...');
    const endpoints = ['products', 'orders', 'ads'];
    for (const ep of endpoints) {
        try {
            const res = await fetch(`${API_URL}/${ep}`);
            if (res.status === 200) {
                const data = await res.json();
                console.log(`✅ /api/${ep}: OK (${data.length} items)`);
            }
            else {
                console.error(`❌ /api/${ep}: Failed (${res.status})`);
            }
        }
        catch (e) {
            console.error(`❌ /api/${ep}: Error ${e.message}`);
        }
    }
    // --- 4. CEO Chat Integration ---
    console.log('\n[4] Testing CEO Chat...');
    try {
        const chatPayload = {
            message: expectedMode === 'simulation' ? 'Status check' : 'Hello CEO',
            mode: expectedMode
        };
        const chatRes = await fetch(`${API_URL}/ceo/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chatPayload)
        });
        const chatData = await chatRes.json();
        if (chatRes.status === 200) {
            console.log(`✅ CEO Response: "${chatData.response.substring(0, 50)}..."`);
            // Heuristic check for Mock vs Real
            const isMockResponse = chatData.response.includes('(Mock Response)') || chatData.response.includes('Mock/Sim');
            if (expectedMode === 'simulation') {
                if (isMockResponse || chatData.response.includes('operational'))
                    console.log('✅ Verified: Received Mock response');
                else
                    console.warn('⚠️ Warning: Expected Mock response, got potential real response?');
            }
            else {
                if (!isMockResponse)
                    console.log('✅ Verified: Received Live AI response');
                else
                    console.error('❌ Error: Received Mock response in Live mode!');
            }
        }
        else {
            console.error(`❌ CEO Chat Failed: ${chatRes.status} - ${JSON.stringify(chatData)}`);
        }
    }
    catch (e) {
        console.error('❌ CEO Chat Error:', e.message);
    }
    // --- 5. Infrastructure ---
    console.log('\n[5] Testing Infrastructure...');
    try {
        const dockerRes = await fetch(`${API_URL}/docker/status`);
        const dockerData = await dockerRes.json();
        console.log(`✅ Docker Status: ${dockerData.running ? 'Running' : 'Stopped'}`);
    }
    catch (e) {
        console.error('❌ Docker Check Failed:', e.message);
    }
    console.log('\n==================================================');
    console.log(`🏁 QA COMPLETE FOR ${expectedMode.toUpperCase()} MODE`);
}
// Read mode from args
const modeArg = process.argv[2];
if (modeArg !== 'simulation' && modeArg !== 'live') {
    console.error('Usage: npx tsx src/qa-automation.ts <simulation|live>');
    process.exit(1);
}
runQA(modeArg).catch(console.error);
