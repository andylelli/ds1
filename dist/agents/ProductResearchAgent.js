import { BaseAgent } from './BaseAgent.js';
export class ProductResearchAgent extends BaseAgent {
    trendAnalyzer;
    competitorAnalyzer;
    constructor(db, trendAnalyzer, competitorAnalyzer) {
        super('ProductResearcher', db);
        this.trendAnalyzer = trendAnalyzer;
        this.competitorAnalyzer = competitorAnalyzer;
        this.registerTool('find_winning_products', this.findWinningProducts.bind(this));
        this.registerTool('analyze_niche', this.analyzeNiche.bind(this));
        this.registerTool('analyze_competitors', this.analyzeCompetitors.bind(this));
    }
    async findWinningProducts(args) {
        const { category, criteria } = args;
        this.log('info', `Searching for winning products in category: ${category}`);
        console.log(`[ProductResearchAgent] Starting product search for category: ${category}`);
        const products = await this.trendAnalyzer.findProducts(category);
        console.log(`[ProductResearchAgent] Found ${products?.length || 0} products`);
        return { products };
    }
    async analyzeNiche(args) {
        const { niche } = args;
        this.log('info', `Analyzing niche: ${niche}`);
        const trendData = await this.trendAnalyzer.analyzeTrend(niche);
        const competitorData = await this.competitorAnalyzer.analyzeCompetitors(niche);
        return {
            niche,
            ...trendData,
            ...competitorData
        };
    }
    async analyzeCompetitors(args) {
        const { category } = args;
        this.log('info', `Analyzing competitors for: ${category}`);
        return this.competitorAnalyzer.analyzeCompetitors(category);
    }
}
