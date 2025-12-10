import { BaseAgent } from './BaseAgent.js';
export class ProductResearchAgent extends BaseAgent {
    trendAnalyzer;
    competitorAnalyzer;
    constructor(db, eventBus, trendAnalyzer, competitorAnalyzer) {
        super('ProductResearcher', db, eventBus);
        this.trendAnalyzer = trendAnalyzer;
        this.competitorAnalyzer = competitorAnalyzer;
        this.registerTool('find_winning_products', this.findWinningProducts.bind(this));
        this.registerTool('analyze_niche', this.analyzeNiche.bind(this));
        this.registerTool('analyze_competitors', this.analyzeCompetitors.bind(this));
    }
    /**
     * Workflow Action: find_products
     * Triggered by: RESEARCH_REQUESTED
     */
    async find_products(payload) {
        const category = payload.category || 'General';
        this.log('info', `Workflow: Finding products for category ${category}`);
        const products = await this.trendAnalyzer.findProducts(category);
        if (products && products.length > 0) {
            for (const product of products) {
                this.log('info', `Found product: ${product.name}`);
                await this.eventBus.publish('PRODUCT_FOUND', 'PRODUCT_FOUND', { product });
            }
        }
        else {
            this.log('warn', `No products found for category ${category}`);
        }
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
