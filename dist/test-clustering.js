import { ProductResearchAgent } from './agents/ProductResearchAgent.js';
import { openAIService } from './infra/ai/OpenAI/OpenAIService.js';
// Mock OpenAI Service
openAIService.generateThemes = async (signals) => {
    console.log('[Mock] Generating themes for signals:', signals.length);
    return [
        {
            name: "Matcha Ceremony Set",
            description: "Traditional matcha preparation kit",
            signal_ids: signals.map(s => s.id),
            rationale: "All signals relate to matcha preparation",
            confidence: 0.95
        }
    ];
};
// Mock Dependencies
const mockDb = {
    saveActivityLog: async () => { },
    getPriorLearnings: async () => []
};
const mockEventBus = {
    subscribe: async () => { },
    publish: async () => { }
};
const mockTrendAnalyzer = {};
const mockCompetitorAnalyzer = {};
async function runTest() {
    const agent = new ProductResearchAgent(mockDb, mockEventBus, mockTrendAnalyzer, mockCompetitorAnalyzer);
    // Create dummy signals
    const signals = [
        { id: 's1', family: 'search', source: 'Google', data: { keyword: 'Matcha Whisk' }, timestamp: new Date().toISOString() },
        { id: 's2', family: 'social', source: 'TikTok', data: { hashtag: '#GreenTea' }, timestamp: new Date().toISOString() },
        { id: 's3', family: 'competitor', source: 'Amazon', data: { product: 'Ceramic Bowl' }, timestamp: new Date().toISOString() }
    ];
    // We need to access the private method generateThemes or trigger it via public API.
    // generateThemes is private.
    // But it is called within the pipeline.
    // I can use `any` cast to call it.
    console.log('Running generateThemes...');
    // @ts-ignore
    const themes = await agent.generateThemes(signals);
    console.log('Themes generated:', JSON.stringify(themes, null, 2));
    if (themes.length === 1 && themes[0].name === "Matcha Ceremony Set") {
        console.log('✅ Test Passed: Themes clustered correctly.');
    }
    else {
        console.error('❌ Test Failed: Unexpected themes.');
    }
}
runTest().catch(console.error);
