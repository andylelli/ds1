import { BaseAgent } from './BaseAgent.js';
import { openAIService } from '../infra/ai/OpenAIService.js';
import { configService } from '../infra/config/ConfigService.js';
import { PersistencePort } from '../core/domain/ports/PersistencePort.js';

export class ProductResearchAgent extends BaseAgent {
  constructor(db: PersistencePort) {
    super('ProductResearcher', db);
    this.registerTool('find_winning_products', this.findWinningProducts.bind(this));
    this.registerTool('analyze_niche', this.analyzeNiche.bind(this));
  }

  async findWinningProducts(args: { category: string, criteria?: any }) {
    const { category, criteria } = args;
    this.log('info', `Searching for winning products in category: ${category}`);
    
    if (configService.get('useSimulatedEndpoints')) {
        return this._findWinningProductsMock(category, criteria);
    } else {
        return this._findWinningProductsReal(category, criteria);
    }
  }

  async _findWinningProductsMock(category: string, criteria: any) {
    try {
      const client = openAIService.getClient();
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
        model: openAIService.deploymentName,
        messages: messages as any,
      });

      const content = result.choices[0].message.content;
      if (!content) throw new Error("No content from AI");

      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanJson);

      const enrichedProducts = data.products.map((p: any) => ({
        ...p,
        images: [`https://via.placeholder.com/600x600.png?text=${encodeURIComponent(p.name)}`]
      }));

      return { products: enrichedProducts };

    } catch (error: any) {
      this.log('error', `AI Research failed: ${error.message}`);
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

  async _findWinningProductsReal(category: string, criteria: any) {
      this.log('info', `[REAL] Querying Google Trends & AliExpress for: ${category}`);
      throw new Error("Real Market Research APIs not implemented yet. Switch to mock mode.");
  }

  async analyzeNiche(args: { niche: string }) {
    const { niche } = args;
    this.log('info', `Analyzing niche: ${niche}`);
    return {
      niche,
      competitionLevel: 'High',
      averageOrderValue: '$45.00',
      trend: 'Rising'
    };
  }
}
