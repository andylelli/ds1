import { BaseAgent } from './BaseAgent.js';
import { PersistencePort } from '../core/domain/ports/PersistencePort.js';
import { TrendAnalysisPort } from '../core/domain/ports/TrendAnalysisPort.js';
import { CompetitorAnalysisPort } from '../core/domain/ports/CompetitorAnalysisPort.js';

export class ProductResearchAgent extends BaseAgent {
  private trendAnalyzer: TrendAnalysisPort;
  private competitorAnalyzer: CompetitorAnalysisPort;

  constructor(db: PersistencePort, trendAnalyzer: TrendAnalysisPort, competitorAnalyzer: CompetitorAnalysisPort) {
    super('ProductResearcher', db);
    this.trendAnalyzer = trendAnalyzer;
    this.competitorAnalyzer = competitorAnalyzer;
    this.registerTool('find_winning_products', this.findWinningProducts.bind(this));
    this.registerTool('analyze_niche', this.analyzeNiche.bind(this));
    this.registerTool('analyze_competitors', this.analyzeCompetitors.bind(this));
  }

  async findWinningProducts(args: { category: string, criteria?: any }) {
    const { category, criteria } = args;
    this.log('info', `Searching for winning products in category: ${category}`);
    
    console.log(`[ProductResearchAgent] Starting product search for category: ${category}`);
    const products = await this.trendAnalyzer.findProducts(category);
    console.log(`[ProductResearchAgent] Found ${products?.length || 0} products`);
    
    return { products };
  }

  async analyzeNiche(args: { niche: string }) {
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

  async analyzeCompetitors(args: { category: string }) {
    const { category } = args;
    this.log('info', `Analyzing competitors for: ${category}`);
    return this.competitorAnalyzer.analyzeCompetitors(category);
  }
}
