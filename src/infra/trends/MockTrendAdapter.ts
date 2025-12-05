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
        id: 'mock_p1', 
        name: `Mock ${category} Product 1`, 
        potential: 'High', 
        margin: '60%',
        images: [`https://via.placeholder.com/600x600.png?text=Mock+${category}`] 
      },
      { 
        id: 'mock_p2', 
        name: `Mock ${category} Product 2`, 
        potential: 'Medium', 
        margin: '40%',
        images: [`https://via.placeholder.com/600x600.png?text=Mock+${category}`] 
      }
    ];
  }
}
