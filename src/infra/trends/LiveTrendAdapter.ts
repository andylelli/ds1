import { TrendAnalysisPort } from '../../core/domain/ports/TrendAnalysisPort.js';
import { openAIService } from '../ai/OpenAIService.js';

export class LiveTrendAdapter implements TrendAnalysisPort {
  async analyzeTrend(category: string): Promise<any> {
    console.log(`[LiveTrend] Querying AI for real-time trends in ${category}`);
    try {
        const client = openAIService.getClient();
        const response = await client.chat.completions.create({
            model: openAIService.deploymentName,
            messages: [{
                role: 'system',
                content: `Analyze current market trends for the category: ${category}. Return JSON with trend (up/down), score (0-100), and top keywords.`
            }]
        });
        const content = response.choices[0].message.content;
        return JSON.parse(content || '{}');
    } catch (e) {
        console.error("Live Trend Analysis failed", e);
        return { error: "Failed to fetch live trends" };
    }
  }

  async checkSaturation(productName: string): Promise<any> {
    console.log(`[LiveTrend] Querying AI for saturation of ${productName}`);
    try {
        const client = openAIService.getClient();
        const response = await client.chat.completions.create({
            model: openAIService.deploymentName,
            messages: [{
                role: 'system',
                content: `Estimate market saturation for: ${productName}. Return JSON with saturationLevel (low/medium/high) and estimated competitors count.`
            }]
        });
        const content = response.choices[0].message.content;
        return JSON.parse(content || '{}');
    } catch (e) {
        console.error("Live Saturation Check failed", e);
        return { error: "Failed to check saturation" };
    }
  }

  async findProducts(category: string): Promise<any[]> {
    console.log(`[LiveTrend] Querying AI for winning products in ${category}`);
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
        { role: "user", content: `Find products matching category: ${category}` }
      ];

      const result = await client.chat.completions.create({
        model: openAIService.deploymentName,
        messages: messages as any,
      });

      const content = result.choices[0].message.content;
      if (!content) throw new Error("No content from AI");

      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanJson);

      return data.products.map((p: any) => ({
        ...p,
        images: [`https://via.placeholder.com/600x600.png?text=${encodeURIComponent(p.name)}`]
      }));

    } catch (error: any) {
      console.error(`[LiveTrend] AI Research failed: ${error.message}`);
      return [];
    }
  }
}
