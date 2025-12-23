import { ProductResearchAgent } from './agents/ProductResearchAgent.js';
import { PersistencePort } from './core/domain/ports/PersistencePort.js';
import { EventBusPort } from './core/domain/ports/EventBusPort.js';
import { TrendAnalysisPort } from './core/domain/ports/TrendAnalysisPort.js';
import { CompetitorAnalysisPort } from './core/domain/ports/CompetitorAnalysisPort.js';
import { VideoAnalysisPort } from './core/domain/ports/VideoAnalysisPort.js';
import { openAIService } from './infra/ai/OpenAI/OpenAIService.js';

// --- Mocks ---
const mockDb: PersistencePort = {
    saveActivity: async (entry: any) => { console.log(`[DB] Activity: ${entry.action}`); },
    saveLog: async (agent: string, msg: string) => { console.log(`[DB] Log: ${agent} - ${msg}`); },
    getPriorLearnings: async () => [],
    saveBrief: async (brief: any) => { console.log('Saved Brief:', brief.meta.id); },
    getProducts: async () => []
} as any;

const mockEventBus: EventBusPort = {
    subscribe: async () => {},
    publish: async (event: any) => { console.log('Published Event:', event.name); }
} as any;

const mockTrendAnalyzer: TrendAnalysisPort = {
    findProducts: async (keyword: string) => {
        console.log(`[MockTrend] Finding products for ${keyword}`);
        return [{ name: 'Test Product', description: 'A test product', price: 100 }];
    },
    analyzeTrend: async (keyword: string) => ({
        keyword,
        volume: 50000,
        growth: 0.5,
        sentiment: 0.8,
        trend_points: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] // Rising
    })
} as any;

const mockCompetitorAnalyzer: CompetitorAnalysisPort = {
    analyzeCompetitors: async (product: string) => {
        console.log(`[MockComp] Analyzing ${product}`);
        return {
            competitors: [],
            saturation_score: 0.2,
            average_price: 50
        };
    }
} as any;

const mockVideoAnalyzer: VideoAnalysisPort = {
    searchVideos: async (query: string) => {
        console.log(`[MockVideo] Searching videos for ${query}`);
        return [{
            id: 'v1',
            title: 'Viral Video',
            views: 1000000,
            likes: 50000,
            comments: 1000,
            url: 'http://youtube.com/v1',
            publishedAt: new Date().toISOString(),
            channelTitle: 'Influencer'
        }];
    },
    getVideoDetails: async () => []
} as any;

// Mock OpenAI for Theme Generation
openAIService.generateThemes = async (signals) => {
    console.log(`[MockAI] Clustering ${signals.length} signals`);
    return [{
        name: "Test Theme: Rising Star",
        description: "A generated theme from signals",
        signal_ids: signals.map(s => s.id),
        rationale: "Signals show strong rising trend and viral video",
        confidence: 0.95,
        seasonality: "Evergreen"
    }];
};

async function runVerification() {
    console.log('--- Starting Integration Verification ---');

    const agent = new ProductResearchAgent(
        mockDb,
        mockEventBus,
        mockTrendAnalyzer,
        mockCompetitorAnalyzer,
        undefined, // Ads
        undefined, // Shop
        mockVideoAnalyzer
    );

    // Inject Strategy Profile manually since we skip Step 1 (Intake) usually or need to mock it
    // But handleResearchRequest calls Step 1.
    // We need to mock OpenAI client for Step 1 if we run handleResearchRequest.
    // Alternatively, we can manually trigger the pipeline if we expose a method, 
    // but handleResearchRequest is the entry point.
    
    // Let's mock the OpenAI client for Step 1 (Intake)
    const mockOpenAIClient = {
        chat: {
            completions: {
                create: async () => ({
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                seasonal_window: { start: "2025-01-01", peak: "2025-06-01", decay: "2025-09-01" },
                                target_personas: ["Tech Enthusiasts"],
                                category_constraints: [],
                                emerging_definition: { min_growth: 10, time_window: "30d" },
                                execution_speed: "normal"
                            })
                        }
                    }]
                })
            }
        }
    };
    
    // Hijack getClient
    openAIService.getClient = () => mockOpenAIClient as any;

    const request = {
        request_id: 'req_verify_001',
        criteria: {
            category: 'Electronics',
            keywords: ['gadgets']
        }
    };

    console.log('Sending Research Request...');
    // We need to access handleResearchRequest which is private, or trigger via event.
    // But we can cast to any.
    await (agent as any).handleResearchRequest(request);

    console.log('--- Verification Complete ---');
    
    // Check internal state
    const briefs = (agent as any).briefs;
    if (briefs.length > 0) {
        console.log(`✅ Success: Generated ${briefs.length} briefs.`);
        console.log('Brief 1 Rationale:', briefs[0].opportunity_definition.rationale);
        console.log('Brief 1 Score:', briefs[0].opportunity_definition.score);
    } else {
        console.error('❌ Failure: No briefs generated.');
    }
}

runVerification().catch(console.error);
