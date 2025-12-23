import { ProductResearchAgent } from './agents/ProductResearchAgent.js';
// Mock Dependencies
const mockDb = { saveActivityLog: async () => { }, getPriorLearnings: async () => [] };
const mockEventBus = { subscribe: async () => { }, publish: async () => { } };
const mockTrendAnalyzer = {};
const mockCompetitorAnalyzer = {};
async function runTest() {
    const agent = new ProductResearchAgent(mockDb, mockEventBus, mockTrendAnalyzer, mockCompetitorAnalyzer);
    // Mock Brief
    const brief = { execution_speed: 'normal' }; // 14 days
    // Scenario A: Rising Trend (Slope > 0.5)
    const themeRising = {
        id: 't1',
        name: 'Rising Star',
        supporting_signals: ['s1'],
        seasonality: 'Evergreen'
    };
    const signalRising = {
        id: 's1',
        family: 'search',
        data: { trend_points: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] } // Slope ~10
    };
    // Scenario B: Falling Trend (Slope < -0.5)
    const themeFalling = {
        id: 't2',
        name: 'Falling Star',
        supporting_signals: ['s2'],
        seasonality: 'Evergreen'
    };
    const signalFalling = {
        id: 's2',
        family: 'search',
        data: { trend_points: [100, 90, 80, 70, 60, 50, 40, 30, 20, 10] } // Slope ~-10
    };
    // Scenario C: Seasonal Late (Winter in Dec)
    // Current date is Dec 22, 2025. Month is 12.
    // Logic: if theme.seasonality === 'Winter' && currentMonth > 11 -> Reject.
    const themeWinter = {
        id: 't3',
        name: 'Winter Coat',
        supporting_signals: ['s3'],
        seasonality: 'Winter'
    };
    const signalWinter = {
        id: 's3',
        family: 'search',
        data: { trend_points: [10, 10, 10, 10, 10, 10, 10] } // Flat
    };
    // Inject signals
    agent.collectedSignals = [signalRising, signalFalling, signalWinter];
    console.log('Running checkTimeFitness...');
    // @ts-ignore
    const { passed, notes } = await agent.checkTimeFitness([themeRising, themeFalling, themeWinter], brief);
    console.log('Notes:', JSON.stringify(notes, null, 2));
    const passedIds = passed.map((t) => t.id);
    if (passedIds.includes('t1') && !passedIds.includes('t2')) {
        console.log('✅ Test Passed: Rising trend passed, Falling trend rejected.');
    }
    else {
        console.error('❌ Test Failed: Trend logic incorrect.');
    }
    if (!passedIds.includes('t3')) {
        console.log('✅ Test Passed: Winter product rejected in December.');
    }
    else {
        console.warn('⚠️ Test Warning: Winter product passed (Check Date/Logic).');
    }
}
runTest().catch(console.error);
