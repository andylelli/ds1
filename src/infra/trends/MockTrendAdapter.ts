import { TrendAnalysisPort } from '../../core/domain/ports/TrendAnalysisPort.js';

export class MockTrendAdapter implements TrendAnalysisPort {
  async analyzeTrend(category: string): Promise<any> {
    console.log(`[MockTrend] Analyzing trends for ${category}`);
    return {
      trend: 'up',
      score: 85,
      keywords: ['viral', 'tiktok made me buy it', category]
    };
  }

  async checkSaturation(productName: string): Promise<any> {
    console.log(`[MockTrend] Checking saturation for ${productName}`);
    return {
      saturationLevel: 'medium',
      competitors: 5
    };
  }

  async findProducts(category: string): Promise<any[]> {
    console.log(`[MockTrend] Returning mock products for ${category}`);
    return [
      { 
        id: 'prod_001', 
        name: `Premium ${category} Resistance Bands Set`, 
        description: `Professional-grade resistance bands perfect for home workouts and physical therapy. Includes 5 resistance levels, door anchor, and carrying case. Made from durable latex-free material.`,
        price: 29.99,
        potential: 'High', 
        margin: '60%',
        images: [`https://via.placeholder.com/600x600.png?text=${category}+Bands`] 
      },
      { 
        id: 'prod_002', 
        name: `${category} Yoga Mat with Alignment Lines`, 
        description: `Extra-thick yoga mat with printed alignment guides for proper form. Non-slip surface, eco-friendly TPE material, and includes carrying strap.`,
        price: 19.99,
        potential: 'Medium', 
        margin: '40%',
        images: [`https://via.placeholder.com/600x600.png?text=${category}+Mat`] 
      }
    ];
  }
}
