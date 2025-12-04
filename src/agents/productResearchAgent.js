/**
 * Product Research Agent
 * 
 * What it does:
 * - Finds potential winning products.
 * - Analyzes market niches and competition.
 * 
 * Interacts with:
 * - Base Agent Class
 * - External Product APIs or Scrapers (simulated)
 */
import { BaseAgent } from './base.js';
import { getOpenAIClient, DEPLOYMENT_NAME } from '../lib/ai.js';
import { config } from '../lib/config.js';

export class ProductResearchAgent extends BaseAgent {
  constructor() {
    super('ProductResearcher');
    this.registerTool('find_winning_products', this.findWinningProducts.bind(this));
    this.registerTool('analyze_niche', this.analyzeNiche.bind(this));
  }

  async findWinningProducts({ category, criteria }) {
    this.log('info', `Searching for winning products in category: ${category}`);
    
    if (config.get('useSimulatedEndpoints')) {
        return this._findWinningProductsMock(category, criteria);
    } else {
        return this._findWinningProductsReal(category, criteria);
    }
  }

  async _findWinningProductsMock(category, criteria) {
    // 1. AI Brainstorming (Step 1: Idea Generation)
    // In a real production app, this would be replaced/augmented by calls to:
    // - Amazon Best Sellers API
    // - AliExpress/CJ Dropshipping API
    // - Google Trends API
    // - TikTok Trends Scraper
    
    try {
      const client = getOpenAIClient();
      const messages = [
        { 
          role: "system", 
          content: `You are an expert dropshipping product researcher. 
          Identify 3 trending, high-potential products in the '${category}' niche. 
          For each product, provide:
          1. A catchy name.
          2. A brief reason why it's a winner (viral potential, problem solver, etc.).
          3. Estimated profit margin.
          4. A search query I could use to find images for it.
          
          Return ONLY valid JSON in this format:
          {
            "products": [
              { "id": "generated_id", "name": "Product Name", "potential": "High/Medium", "margin": "50%", "image_search_query": "query" }
            ]
          }` 
        },
        { role: "user", content: `Find products matching criteria: ${JSON.stringify(criteria || {})}` }
      ];

      const result = await client.chat.completions.create({
        model: DEPLOYMENT_NAME,
        messages: messages,
      });

      const content = result.choices[0].message.content;
      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanJson);

      // 2. Image Enrichment (Mock)
      // In reality, we would take 'image_search_query' and hit a Google Images or Supplier API
      const enrichedProducts = data.products.map(p => ({
        ...p,
        images: [`https://via.placeholder.com/600x600.png?text=${encodeURIComponent(p.name)}`]
      }));

      return { products: enrichedProducts };

    } catch (error) {
      this.log('error', `AI Research failed: ${error.message}`);
      // Fallback to hardcoded mock data if AI fails
      return {
        products: [
          { 
            id: 'p1', 
            name: 'Smart Posture Corrector (Fallback)', 
            potential: 'High', 
            margin: '65%',
            images: ['https://via.placeholder.com/600x600.png?text=Posture+Corrector'] 
          }
        ]
      };
    }
  }

  async _findWinningProductsReal(category, criteria) {
      this.log('info', `[REAL] Querying Google Trends & AliExpress for: ${category}`);
      // TODO: Implement Real Market Research APIs
      // 1. Google Trends API to check interest
      // 2. AliExpress API to check order volume
      // 3. Amazon API to check best sellers
      
      throw new Error("Real Market Research APIs not implemented yet. Switch to mock mode.");
  }

  async analyzeNiche({ niche }) {
    this.log('info', `Analyzing niche: ${niche}`);
    return {
      niche,
      competitionLevel: 'High',
      averageOrderValue: '$45.00',
      trend: 'Rising'
    };
  }
}
