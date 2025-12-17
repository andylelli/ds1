import { TrendAnalysisPort } from '../../../core/domain/ports/TrendAnalysisPort.js';

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
    console.log(`[MockTrend] Generating smart mock products for ${category}`);
    
    const adjectives = ['Premium', 'Eco-Friendly', 'Smart', 'Portable', 'Luxury', 'Compact', 'Durable'];
    const nouns = ['Kit', 'Set', 'Device', 'Tool', 'Accessory', 'Bundle'];
    
    const products = [];
    const count = Math.floor(Math.random() * 3) + 1; // 1 to 3 products

    for (let i = 0; i < count; i++) {
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const price = parseFloat((Math.random() * 100 + 10).toFixed(2));
        const cost = price * (0.3 + Math.random() * 0.4); // Cost is 30-70% of price
        const marginVal = ((price - cost) / price) * 100;
        
        products.push({
            id: `prod_${Date.now()}_${i}`,
            name: `${adj} ${category} ${noun}`,
            description: `A high-quality ${category.toLowerCase()} product designed for the modern consumer. Features state-of-the-art materials and ergonomic design.`,
            price: price,
            cost: parseFloat(cost.toFixed(2)),
            margin: `${marginVal.toFixed(0)}%`,
            potential: marginVal > 50 ? 'High' : 'Medium',
            images: [`https://via.placeholder.com/600x600.png?text=${category}+${noun}`]
        });
    }

    return products;
  }
}
