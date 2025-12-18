import { BaseAgent } from './BaseAgent.js';
import { PersistencePort } from '../core/domain/ports/PersistencePort.js';
import { EventBusPort } from '../core/domain/ports/EventBusPort.js';
import { TrendAnalysisPort } from '../core/domain/ports/TrendAnalysisPort.js';
import { CompetitorAnalysisPort } from '../core/domain/ports/CompetitorAnalysisPort.js';
import { openAIService } from '../infra/ai/OpenAIService.js';

export class ProductResearchAgent extends BaseAgent {
  private trendAnalyzer: TrendAnalysisPort;
  private competitorAnalyzer: CompetitorAnalysisPort;

  constructor(db: PersistencePort, eventBus: EventBusPort, trendAnalyzer: TrendAnalysisPort, competitorAnalyzer: CompetitorAnalysisPort) {
    super('ProductResearcher', db, eventBus);
    this.trendAnalyzer = trendAnalyzer;
    this.competitorAnalyzer = competitorAnalyzer;
    this.registerTool('find_winning_products', this.findWinningProducts.bind(this));
    this.registerTool('analyze_niche', this.analyzeNiche.bind(this));
    this.registerTool('analyze_competitors', this.analyzeCompetitors.bind(this));

    // Subscribe to Research Requests
    this.eventBus.subscribe('OpportunityResearch.Requested', 'ProductResearchAgent', async (event) => {
      this.log('info', `Received Research Request: ${event.payload.request_id}`);
      await this.handleResearchRequest(event.payload);
    });
  }

  /**
   * Event Handler for OpportunityResearch.Requested
   */
  private async handleResearchRequest(payload: { request_id: string, criteria: any }) {
    const { request_id, criteria } = payload;
    const briefId = `brief_${request_id}_${Date.now()}`;

    // 1. Create Brief
    await this.eventBus.publish('OpportunityResearch.BriefCreated', {
      brief_id: briefId,
      initial_scope: criteria
    }, request_id);

    try {
      // 2. Execute Research (reusing existing logic for now)
      const result = await this.findWinningProducts({ category: criteria.category || 'General' });

      // 3. Publish Results
      if (result.products && result.products.length > 0) {
        // Publish Signals Collected
        await this.eventBus.publish('OpportunityResearch.SignalsCollected', {
          brief_id: briefId,
          signal_count: result.products.length,
          sources: ['GoogleTrends', 'BigQuery']
        }, request_id);

        // Publish Final Brief
        await this.eventBus.publish('OpportunityResearch.BriefPublished', {
          brief_id: briefId,
          brief_json: {
            products: result.products,
            strategy: 'Trend Analysis'
          }
        }, request_id);

        // Legacy compatibility
        for (const product of result.products) {
           await this.eventBus.publish('Product.Found', { product }, request_id);
        }

      } else {
        await this.eventBus.publish('OpportunityResearch.Aborted', {
          brief_id: briefId,
          reason: 'No products found matching criteria'
        }, request_id);
      }

    } catch (error: any) {
      this.log('error', `Research failed: ${error.message}`);
      await this.eventBus.publish('OpportunityResearch.Aborted', {
        brief_id: briefId,
        reason: error.message
      }, request_id);
    }
  }

  private async generateSearchStrategies(userInput: string): Promise<string[]> {
    try {
      const client = openAIService.getClient();
      const response = await client.chat.completions.create({
        model: openAIService.deploymentName,
        messages: [
          {
            role: "system",
            content: "You are an expert dropshipping researcher. Given the user's request, generate 3 distinct, high-potential search terms to find trending products in Google Trends. Think about specific niches, synonyms, or related product types. Return them as a comma-separated list (e.g. 'kitchen gadgets, air fryer, cooking utensils'). Return ONLY the list."
          },
          {
            role: "user",
            content: userInput
          }
        ],
        temperature: 0.4,
        max_tokens: 60
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (content) {
        const keywords = content.split(',').map(k => k.trim()).filter(k => k.length > 0);
        this.log('info', `🤖 AI Search Strategy: "${userInput}" ➔ [${keywords.join(', ')}]`);
        return keywords;
      }
    } catch (error) {
      this.log('warn', `AI strategy generation failed: ${error}. Using original input.`);
    }
    return [userInput];
  }

  /**
   * Workflow Action: find_products
   * Triggered by: RESEARCH_REQUESTED
   */
  async find_products(payload: any) {
      const rawCategory = payload.category || 'General';
      // Use the robust findWinningProducts logic
      const result = await this.findWinningProducts({ category: rawCategory });
      
      if (result.products && result.products.length > 0) {
          for (const product of result.products) {
              this.log('info', `✅ Found product: ${product.name}`);
              await this.eventBus.publish('Product.Found', { product });
          }
      } else {
          this.log('warn', `❌ No products found for category "${rawCategory}" after AI analysis.`);
      }
  }

  private async findWinningProducts(args: { category: string, criteria?: any }) {
    const { category: rawCategory, criteria } = args;
    
    // 1. Generate strategies (Iterative approach)
    const searchTerms = await this.generateSearchStrategies(rawCategory);
    
    let allProducts: any[] = [];
    let usedKeyword = rawCategory; // Default fallback

    // 2. Iterate through terms
    for (const term of searchTerms) {
        this.log('info', `🔎 Strategy: Searching BigQuery for "${term}"...`);
        try {
            const products = await this.trendAnalyzer.findProducts(term);
            
            if (products && products.length > 0) {
                this.log('info', `   Found ${products.length} products for "${term}"`);
                allProducts = [...allProducts, ...products];
                usedKeyword = term; // Track the last successful term (or we could track the 'best' one)
            } else {
                this.log('info', `   No products found for "${term}"`);
            }
        } catch (error: any) {
            this.log('error', `❌ Search failed for "${term}": ${error.message}`);
            // If it's a critical config error, stop the loop
            if (error.message.includes("GCP_PROJECT_ID")) {
                throw error;
            }
        }
    }

    // 3. Deduplicate and Sort
    // Deduplicate by name
    const uniqueProducts = Array.from(new Map(allProducts.map(p => [p.name, p])).values());
    
    // Sort by profit potential (descending)
    uniqueProducts.sort((a, b) => (b.profitPotential || 0) - (a.profitPotential || 0));

    console.log(`[ProductResearchAgent] Total unique products found: ${uniqueProducts.length}`);

    if (uniqueProducts.length > 0) {
        const winner = uniqueProducts[0];
        this.log('info', `🏆 Winner Selected: "${winner.name}"`);
        this.log('info', `   Stats: Profit Potential ${winner.profitPotential?.toFixed(1)} | Demand ${winner.demandScore} | Competition ${winner.competitionScore}`);
        if (uniqueProducts.length > 1) {
            this.log('info', `   (Selected over ${uniqueProducts.length - 1} other candidates like "${uniqueProducts[1].name}")`);
        }
    } else {
        this.log('warn', `❌ No viable products found after analyzing all strategies.`);
    }
    
    // If we found products, return them. If not, we return empty list and the last attempted keyword.
    return { products: uniqueProducts, usedKeyword: uniqueProducts.length > 0 ? usedKeyword : searchTerms[0] };
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
