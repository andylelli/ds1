import { ProductResearchAgent } from './agents/ProductResearchAgent.js';
// Mock Dependencies
const mockDb = { saveActivityLog: async () => { }, getPriorLearnings: async () => [] };
const mockEventBus = { subscribe: async () => { }, publish: async () => { } };
const mockTrendAnalyzer = {};
const mockCompetitorAnalyzer = {};
async function runTest() {
    const agent = new ProductResearchAgent(mockDb, mockEventBus, mockTrendAnalyzer, mockCompetitorAnalyzer);
    // Setup Strategy Profile
    agent.strategyProfile = {
        scoring_config: {
            weights: { demand: 0.4, trend: 0.3, competition: 0.2, risk: 0.1 }
        }
    };
    // Scenario A: High Demand, High Trend, Low Competition
    const signalsA = [
        { id: 's1', family: 'search', data: { volume: 100000, trend_points: [10, 20, 30, 40, 50] } }, // Slope ~8 -> Score 100
        { id: 's2', family: 'social', data: { views: 1000000 } }, // Score 100
        // No competitors
    ];
    const themeA = { id: 't1', supporting_signals: ['s1', 's2'], certainty: 'Observed' };
    // Scenario B: Low Demand, Flat Trend, High Competition
    const signalsB = [
        { id: 's3', family: 'search', data: { volume: 1000, trend_points: [10, 10, 10, 10, 10] } }, // Slope 0 -> Score 0
        { id: 's4', family: 'competitor', data: {} },
        { id: 's5', family: 'competitor', data: {} },
        { id: 's6', family: 'competitor', data: {} },
        { id: 's7', family: 'competitor', data: {} },
        { id: 's8', family: 'competitor', data: {} },
        { id: 's9', family: 'competitor', data: {} },
        { id: 's10', family: 'competitor', data: {} },
        { id: 's11', family: 'competitor', data: {} },
        { id: 's12', family: 'competitor', data: {} },
        { id: 's13', family: 'competitor', data: {} }, // 10+ competitors -> Comp Score 100 -> Factor 0
    ];
    const themeB = { id: 't2', supporting_signals: ['s3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12', 's13'], certainty: 'Inferred' };
    // Inject signals
    agent.collectedSignals = [...signalsA, ...signalsB];
    console.log('Running scoreAndRankThemes...');
    // @ts-ignore
    const ranked = await agent.scoreAndRankThemes([themeA, themeB], []);
    console.log('Ranked Themes:', JSON.stringify(ranked, null, 2));
    const scoreA = ranked.find((t) => t.id === 't1')?.score || 0;
    const scoreB = ranked.find((t) => t.id === 't2')?.score || 0;
    console.log(`Score A (High Potential): ${scoreA}`);
    console.log(`Score B (Low Potential): ${scoreB}`);
    if (scoreA > 80 && scoreB < 40) {
        console.log('✅ Test Passed: Scoring logic works as expected.');
    }
    else {
        console.error('❌ Test Failed: Scores out of expected range.');
    }
}
runTest().catch(console.error);
