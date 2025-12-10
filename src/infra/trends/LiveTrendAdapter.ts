import { TrendAnalysisPort } from '../../core/domain/ports/TrendAnalysisPort.js';
import { openAIService } from '../ai/OpenAIService.js';
import { ResearchStagingService } from '../../core/services/ResearchStagingService.js';
import { ActivityLogService } from '../../core/services/ActivityLogService.js';
import { Pool } from 'pg';
import googleTrends from 'google-trends-api';

export class LiveTrendAdapter implements TrendAnalysisPort {
  private stagingService: ResearchStagingService;
  private activityLog: ActivityLogService;
  private stagingEnabled: boolean;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_TTL = 1000 * 60 * 60; // 1 hour

  constructor(pool: Pool, stagingEnabled = true) {
    this.stagingService = new ResearchStagingService(pool);
    this.activityLog = new ActivityLogService(pool);
    this.stagingEnabled = stagingEnabled;
  }
  async analyzeTrend(category: string): Promise<any> {
    console.log(`[LiveTrend] Analyzing trend for ${category} using Google Trends`);
    try {
      // 1. Get interest over time from Google Trends
      const interestData = await this.getInterestOverTime(category);
      
      // 2. Get related queries (rising = opportunity)
      const relatedQueries = await this.getRelatedQueries(category);
      
      // 3. Calculate trend score
      const trendScore = this.calculateTrendScore(interestData);
      
      return {
        category,
        trendScore,           // 0-100
        direction: trendScore > 60 ? 'rising' : trendScore > 40 ? 'stable' : 'declining',
        interestOverTime: interestData,
        risingQueries: relatedQueries.rising,
        topQueries: relatedQueries.top,
        recommendation: trendScore > 50 ? 'PROCEED' : 'CAUTION',
        source: 'google_trends'
      };
    } catch (error: any) {
      console.error(`[LiveTrend] Google Trends failed, falling back to AI:`, error.message);
      return this.analyzeTrendWithAI(category);
    }
  }

  async checkSaturation(productName: string): Promise<any> {
    console.log(`[LiveTrend] Checking saturation for ${productName}`);
    try {
      const interestData = await this.getInterestOverTime(productName);
      const recentTrend = this.analyzeRecentTrend(interestData);
      
      return {
        productName,
        saturationLevel: recentTrend.stable && recentTrend.high ? 'HIGH' : 
                        recentTrend.rising ? 'LOW' : 'MEDIUM',
        recommendation: recentTrend.rising ? 'OPPORTUNITY' : 
                        recentTrend.declining ? 'AVOID' : 'COMPETITIVE',
        trendData: recentTrend,
        source: 'google_trends'
      };
    } catch (error: any) {
      console.error(`[LiveTrend] Saturation check failed, using AI:`, error.message);
      return this.checkSaturationWithAI(productName);
    }
  }

  async findProducts(category: string): Promise<any[]> {
    console.log(`[LiveTrend] Finding products in ${category} using Google Trends + AI`);
    
    await this.activityLog.log({
      agent: 'Research',
      action: 'find_products',
      category: 'research',
      status: 'started',
      message: `Searching for products in ${category} using Google Trends`,
      details: { category, source: 'google_trends' }
    });
    
    try {
      // 1. Get rising queries from Google Trends
      const { rising } = await this.getRelatedQueries(category);
      
      // 2. Get daily trends for the region
      const dailyTrends = await this.getDailyTrends();
      
      // 3. Use AI to synthesize into product recommendations
      const products = await this.synthesizeProductsWithAI(category, rising, dailyTrends);
      
      // 4. If staging enabled, put in staging area
      if (this.stagingEnabled) {
        const sessionId = await this.stagingService.createSession(
          category, 
          'product_discovery',
          { trends: 'live', research: 'mock' }
        );
        
        for (const product of products) {
          await this.stagingService.stageItem(sessionId, {
            itemType: 'product',
            name: product.name,
            description: product.description,
            rawData: product,
            confidenceScore: product.confidence * 10, // Convert 1-10 to 0-100
            source: 'google_trends',
            trendEvidence: product.trendEvidence || 'AI-synthesized from Google Trends data'
          });
        }
        
        await this.stagingService.completeSession(sessionId);
        
        await this.activityLog.log({
          agent: 'Research',
          action: 'find_products',
          category: 'research',
          status: 'completed',
          entityType: 'session',
          entityId: sessionId,
          message: `Found ${products.length} products in ${category}, staged for review`,
          details: { 
            category, 
            count: products.length,
            sessionId,
            staged: true,
            source: 'google_trends'
          }
        });
        
        // Return indication that items are staged
        return [{
          staged: true,
          sessionId,
          itemCount: products.length,
          message: `${products.length} products staged for review. Session: ${sessionId}`,
          reviewUrl: `/staging.html?session=${sessionId}`
        } as any];
      }
      
      // 5. If staging disabled, return directly (legacy behavior)
      return products;
      
    } catch (error: any) {
      console.error(`[LiveTrend] Google Trends + AI failed: ${error.message}`);
      
      await this.activityLog.log({
        agent: 'Research',
        action: 'find_products',
        category: 'research',
        status: 'warning',
        message: `Google Trends API failed for ${category}, falling back to AI-only`,
        details: { category, error: error.message, fallback: true }
      });
      
      return this.fallbackToAIOnly(category);
    }
  }

  // Method to get only approved products
  async getApprovedProducts(sessionId?: string): Promise<any[]> {
    return this.stagingService.getApprovedProducts(sessionId);
  }

  // === Google Trends Helper Methods ===

  private async getInterestOverTime(keyword: string): Promise<any> {
    return this.cachedRequest(`interest_${keyword}`, async () => {
      const result = await googleTrends.interestOverTime({
        keyword,
        startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        geo: 'US'
      });
      return JSON.parse(result);
    });
  }

  private async getRelatedQueries(keyword: string): Promise<any> {
    return this.cachedRequest(`queries_${keyword}`, async () => {
      const result = await googleTrends.relatedQueries({ keyword, geo: 'US' });
      const parsed = JSON.parse(result);
      return {
        rising: parsed.default?.rankedList?.[0]?.rankedKeyword || [],
        top: parsed.default?.rankedList?.[1]?.rankedKeyword || []
      };
    });
  }

  private async getDailyTrends(): Promise<any> {
    return this.cachedRequest('daily_trends', async () => {
      const result = await googleTrends.dailyTrends({ geo: 'US' });
      return JSON.parse(result);
    });
  }

  private async synthesizeProductsWithAI(
    category: string, 
    risingQueries: any[], 
    dailyTrends: any
  ): Promise<any[]> {
    const client = openAIService.getClient();
    
    const prompt = `You are an expert dropshipping product researcher.

Based on the following REAL Google Trends data, identify 3 specific products to sell in the "${category}" niche.

RISING SEARCH QUERIES (opportunity indicators):
${risingQueries.slice(0, 10).map((q: any) => `- "${q.query || q}" (${q.formattedValue || 'rising'})`).join('\n')}

TODAY'S TRENDING TOPICS:
${dailyTrends.default?.trendingSearchesDays?.[0]?.trendingSearches?.slice(0, 5).map((t: any) => `- ${t.title.query}`).join('\n') || 'N/A'}

For each product, provide:
1. Specific product name (not generic)
2. Why it's trending NOW (cite the data above)
3. Estimated profit margin
4. Confidence score (1-10)
5. Evidence from the trend data

Return ONLY valid JSON:
{
  "products": [
    {
      "id": "generated_id",
      "name": "Product Name",
      "description": "Why this is a winner based on trend data",
      "potential": "High/Medium/Low",
      "margin": "60%",
      "confidence": 8,
      "trendEvidence": "Based on rising query: X"
    }
  ]
}`;

    const result = await client.chat.completions.create({
      model: openAIService.deploymentName,
      messages: [
        { role: 'system', content: 'You are a data-driven product researcher. Base recommendations on the provided trend data.' },
        { role: 'user', content: prompt }
      ] as any
    });

    const content = result.choices[0].message.content || '{"products":[]}';
    const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);

    return data.products.map((p: any) => ({
      ...p,
      id: p.id || `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      images: [`https://via.placeholder.com/600x600.png?text=${encodeURIComponent(p.name)}`],
      source: 'google_trends'
    }));
  }

  // === Scoring & Analysis ===

  private calculateTrendScore(interestData: any): number {
    const timeline = interestData.default?.timelineData || [];
    if (timeline.length < 2) return 50;
    
    const recent = timeline.slice(-7).map((d: any) => d.value[0] || 0);
    const older = timeline.slice(-30, -7).map((d: any) => d.value[0] || 0);
    
    const recentAvg = recent.reduce((a: number, b: number) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a: number, b: number) => a + b, 0) / older.length;
    
    // If recent > older, trend is rising
    const growth = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    
    // Normalize to 0-100 scale
    return Math.min(100, Math.max(0, 50 + growth));
  }

  private analyzeRecentTrend(interestData: any): any {
    const score = this.calculateTrendScore(interestData);
    const timeline = interestData.default?.timelineData || [];
    const avgValue = timeline.length > 0 
      ? timeline.reduce((a: any, b: any) => a + (b.value[0] || 0), 0) / timeline.length 
      : 50;
    
    return {
      rising: score > 60,
      stable: score >= 40 && score <= 60,
      declining: score < 40,
      high: avgValue > 70,
      low: avgValue < 30
    };
  }

  // === Caching ===

  private async cachedRequest<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`[LiveTrend] Cache hit for ${key}`);
      return cached.data;
    }
    
    console.log(`[LiveTrend] Cache miss for ${key}, fetching...`);
    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  // === AI Fallback Methods ===

  private async analyzeTrendWithAI(category: string): Promise<any> {
    console.log(`[LiveTrend] Using AI-only for trend analysis`);
    const client = openAIService.getClient();
    const response = await client.chat.completions.create({
      model: openAIService.deploymentName,
      messages: [{
        role: 'system',
        content: `Analyze current market trends for the category: ${category}. Return JSON with trend (up/down), score (0-100), and top keywords.`
      }] as any
    });
    const content = response.choices[0].message.content;
    return { ...JSON.parse(content || '{}'), source: 'ai_fallback' };
  }

  private async checkSaturationWithAI(productName: string): Promise<any> {
    console.log(`[LiveTrend] Using AI-only for saturation check`);
    const client = openAIService.getClient();
    const response = await client.chat.completions.create({
      model: openAIService.deploymentName,
      messages: [{
        role: 'system',
        content: `Estimate market saturation for: ${productName}. Return JSON with saturationLevel (low/medium/high) and estimated competitors count.`
      }] as any
    });
    const content = response.choices[0].message.content;
    return { ...JSON.parse(content || '{}'), source: 'ai_fallback' };
  }

  private async fallbackToAIOnly(category: string): Promise<any[]> {
    console.log(`[LiveTrend] Using AI-only for product discovery`);
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
          4. Confidence score (1-10).
          
          Return ONLY valid JSON in this format:
          {
            "products": [
              { "id": "generated_id", "name": "Product Name", "description": "Why it's a winner", "potential": "High/Medium", "margin": "50%", "confidence": 7 }
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
        images: [`https://via.placeholder.com/600x600.png?text=${encodeURIComponent(p.name)}`],
        source: 'ai_fallback'
      }));

    } catch (error: any) {
      console.error(`[LiveTrend] AI fallback failed: ${error.message}`);
      return [];
    }
  }
}
