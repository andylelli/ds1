import { openAIService } from '../ai/OpenAIService.js';
import { ResearchStagingService } from '../../core/services/ResearchStagingService.js';
import { ActivityLogService } from '../../core/services/ActivityLogService.js';
import googleTrends from 'google-trends-api';
export class LiveTrendAdapter {
    stagingService;
    activityLog;
    stagingEnabled;
    cache = new Map();
    CACHE_TTL = 1000 * 60 * 60; // 1 hour
    constructor(pool, stagingEnabled = true) {
        this.stagingService = new ResearchStagingService(pool);
        this.activityLog = new ActivityLogService(pool);
        this.stagingEnabled = stagingEnabled;
    }
    async analyzeTrend(category) {
        console.log(`[LiveTrend] Analyzing trend for ${category} using Google Trends`);
        await this.activityLog.log({
            agent: 'ProductResearcher',
            action: 'analyze_trend',
            category: 'research',
            status: 'started',
            message: `Analyzing trend for ${category} using Google Trends`,
            details: { category, source: 'google_trends' }
        });
        try {
            // 1. Get interest over time from Google Trends
            const interestData = await this.getInterestOverTime(category);
            // 2. Get related queries (rising = opportunity)
            const relatedQueries = await this.getRelatedQueries(category);
            // 3. Calculate trend score
            const trendScore = this.calculateTrendScore(interestData);
            const result = {
                category,
                trendScore, // 0-100
                direction: trendScore > 60 ? 'rising' : trendScore > 40 ? 'stable' : 'declining',
                interestOverTime: interestData,
                risingQueries: relatedQueries.rising,
                topQueries: relatedQueries.top,
                recommendation: trendScore > 50 ? 'PROCEED' : 'CAUTION',
                source: 'google_trends'
            };
            await this.activityLog.log({
                agent: 'ProductResearcher',
                action: 'analyze_trend',
                category: 'research',
                status: 'completed',
                message: `Successfully analyzed trend for ${category}`,
                details: { trendScore: result.trendScore, direction: result.direction }
            });
            return result;
        }
        catch (error) {
            console.error(`[LiveTrend] Google Trends failed, falling back to AI:`, error.message);
            await this.activityLog.log({
                agent: 'ProductResearcher',
                action: 'analyze_trend',
                category: 'research',
                status: 'warning',
                message: `Google Trends failed for ${category}, falling back to AI`,
                details: { error: error.message, stack: error.stack, fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)) }
            });
            return this.analyzeTrendWithAI(category);
        }
    }
    async checkSaturation(productName) {
        console.log(`[LiveTrend] Checking saturation for ${productName}`);
        await this.activityLog.log({
            agent: 'ProductResearcher',
            action: 'check_saturation',
            category: 'research',
            status: 'started',
            message: `Checking saturation for ${productName} using Google Trends`,
            details: { productName, source: 'google_trends' }
        });
        try {
            const interestData = await this.getInterestOverTime(productName);
            const recentTrend = this.analyzeRecentTrend(interestData);
            const result = {
                productName,
                saturationLevel: recentTrend.stable && recentTrend.high ? 'HIGH' :
                    recentTrend.rising ? 'LOW' : 'MEDIUM',
                recommendation: recentTrend.rising ? 'OPPORTUNITY' :
                    recentTrend.declining ? 'AVOID' : 'COMPETITIVE',
                trendData: recentTrend,
                source: 'google_trends'
            };
            await this.activityLog.log({
                agent: 'ProductResearcher',
                action: 'check_saturation',
                category: 'research',
                status: 'completed',
                message: `Saturation check complete for ${productName}`,
                details: { saturation: result.saturationLevel, recommendation: result.recommendation }
            });
            return result;
        }
        catch (error) {
            console.error(`[LiveTrend] Saturation check failed, using AI:`, error.message);
            await this.activityLog.log({
                agent: 'ProductResearcher',
                action: 'check_saturation',
                category: 'research',
                status: 'warning',
                message: `Google Trends saturation check failed for ${productName}, falling back to AI`,
                details: { error: error.message, stack: error.stack, fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)) }
            });
            return this.checkSaturationWithAI(productName);
        }
    }
    async findProducts(category) {
        console.log(`[LiveTrend] Finding products in ${category} using Google Trends + AI`);
        await this.activityLog.log({
            agent: 'ProductResearcher',
            action: 'find_products',
            category: 'research',
            status: 'started',
            message: `Searching for products in ${category} using Google Trends`,
            details: { category, source: 'google_trends' }
        });
        try {
            // 1. Get rising queries from Google Trends
            const { rising } = await this.getRelatedQueries(category);
            // 2. Get real-time trends for the region (Daily Trends is broken)
            const realTimeTrends = await this.getRealTimeTrends();
            // 3. Use AI to synthesize into product recommendations
            const products = await this.synthesizeProductsWithAI(category, rising, realTimeTrends);
            // 4. If staging enabled, put in staging area
            if (this.stagingEnabled) {
                const sessionId = await this.stagingService.createSession(category, 'product_discovery', { trends: 'live', research: 'mock' });
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
                    agent: 'ProductResearcher',
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
                    }];
            }
            // 5. If staging disabled, return directly (legacy behavior)
            return products;
        }
        catch (error) {
            console.error(`[LiveTrend] Google Trends + AI failed: ${error.message}`);
            await this.activityLog.log({
                agent: 'ProductResearcher',
                action: 'find_products',
                category: 'research',
                status: 'warning',
                message: `Google Trends API failed for ${category}, falling back to AI-only`,
                details: { category, error: error.message, stack: error.stack, fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)), fallback: true }
            });
            return this.fallbackToAIOnly(category);
        }
    }
    // Method to get only approved products
    async getApprovedProducts(sessionId) {
        return this.stagingService.getApprovedProducts(sessionId);
    }
    // === Google Trends Helper Methods ===
    async retry(fn, retries = 0, delay = 2000) {
        try {
            return await fn();
        }
        catch (error) {
            if (retries === 0)
                throw error;
            // Check if it's a rate limit (HTML response)
            if (error.message && error.message.includes('Response starts with: <')) {
                const msg = `[LiveTrend] Google Trends returned HTML (likely Rate Limit). Retrying in ${delay * 2}ms...`;
                console.warn(msg);
                // Log to DB so it appears in Error Log
                await this.activityLog.log({
                    agent: 'ProductResearcher',
                    action: 'google_trends_retry',
                    category: 'system',
                    status: 'warning',
                    message: 'Google Trends Rate Limit detected (HTML response)',
                    details: { error: error.message, stack: error.stack, fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)), retryDelay: delay * 2, retriesLeft: retries - 1 }
                });
                // Increase delay significantly for rate limits
                await new Promise(resolve => setTimeout(resolve, delay * 2));
                return this.retry(fn, retries - 1, delay * 4);
            }
            console.warn(`[LiveTrend] Operation failed, retrying in ${delay}ms... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.retry(fn, retries - 1, delay * 2);
        }
    }
    async getInterestOverTime(keyword) {
        return this.cachedRequest(`interest_${keyword}`, async () => {
            return this.retry(async () => {
                const result = await googleTrends.interestOverTime({
                    keyword,
                    startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
                    geo: 'US'
                });
                try {
                    return JSON.parse(result);
                }
                catch (e) {
                    console.error(`[LiveTrend] JSON Parse Error (interestOverTime): ${result.substring(0, 200)}`);
                    throw new Error(`Invalid JSON from Google Trends (interestOverTime). Response starts with: ${result.substring(0, 500)}...`);
                }
            });
        });
    }
    async getRelatedQueries(keyword) {
        return this.cachedRequest(`queries_${keyword}`, async () => {
            return this.retry(async () => {
                const result = await googleTrends.relatedQueries({ keyword, geo: 'US' });
                try {
                    const parsed = JSON.parse(result);
                    return {
                        rising: parsed.default?.rankedList?.[0]?.rankedKeyword || [],
                        top: parsed.default?.rankedList?.[1]?.rankedKeyword || []
                    };
                }
                catch (e) {
                    console.error(`[LiveTrend] JSON Parse Error (relatedQueries): ${result.substring(0, 200)}`);
                    throw new Error(`Invalid JSON from Google Trends (relatedQueries). Response starts with: ${result.substring(0, 500)}...`);
                }
            });
        });
    }
    async getRealTimeTrends() {
        return this.cachedRequest('real_time_trends', async () => {
            try {
                return await this.retry(async () => {
                    const result = await googleTrends.realTimeTrends({ geo: 'US' });
                    try {
                        return JSON.parse(result);
                    }
                    catch (e) {
                        console.error(`[LiveTrend] JSON Parse Error (realTimeTrends): ${result.substring(0, 200)}`);
                        throw new Error(`Invalid JSON from Google Trends (realTimeTrends). Response starts with: ${result.substring(0, 500)}...`);
                    }
                });
            }
            catch (e) {
                console.warn(`[LiveTrend] Real Time Trends failed. Continuing without trend data. Error: ${e.message}`);
                return { storySummaries: { trendingStories: [] } };
            }
        });
    }
    async synthesizeProductsWithAI(category, risingQueries, realTimeTrends) {
        const client = openAIService.getClient();
        const prompt = `You are an expert dropshipping product researcher.

Based on the following REAL Google Trends data, identify 3 specific products to sell in the "${category}" niche.

RISING SEARCH QUERIES (opportunity indicators):
${risingQueries.slice(0, 10).map((q) => `- "${q.query || q}" (${q.formattedValue || 'rising'})`).join('\n')}

REAL-TIME TRENDING STORIES (General Context):
${realTimeTrends.storySummaries?.trendingStories?.slice(0, 5).map((t) => `- ${t.title} (Entities: ${t.entityNames?.join(', ')})`).join('\n') || 'N/A'}

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
            ]
        });
        const content = result.choices[0].message.content || '{"products":[]}';
        const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanJson);
        return data.products.map((p) => ({
            ...p,
            id: p.id || `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            images: [`https://via.placeholder.com/600x600.png?text=${encodeURIComponent(p.name)}`],
            source: 'google_trends'
        }));
    }
    // === Scoring & Analysis ===
    calculateTrendScore(interestData) {
        const timeline = interestData.default?.timelineData || [];
        if (timeline.length < 2)
            return 50;
        const recent = timeline.slice(-7).map((d) => d.value[0] || 0);
        const older = timeline.slice(-30, -7).map((d) => d.value[0] || 0);
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        // If recent > older, trend is rising
        const growth = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
        // Normalize to 0-100 scale
        return Math.min(100, Math.max(0, 50 + growth));
    }
    analyzeRecentTrend(interestData) {
        const score = this.calculateTrendScore(interestData);
        const timeline = interestData.default?.timelineData || [];
        const avgValue = timeline.length > 0
            ? timeline.reduce((a, b) => a + (b.value[0] || 0), 0) / timeline.length
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
    async cachedRequest(key, fetcher) {
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
    async analyzeTrendWithAI(category) {
        console.log(`[LiveTrend] Using AI-only for trend analysis`);
        const client = openAIService.getClient();
        const response = await client.chat.completions.create({
            model: openAIService.deploymentName,
            messages: [{
                    role: 'system',
                    content: `Analyze current market trends for the category: ${category}. Return JSON with trend (up/down), score (0-100), and top keywords.`
                }]
        });
        const content = response.choices[0].message.content;
        return { ...JSON.parse(content || '{}'), source: 'ai_fallback' };
    }
    async checkSaturationWithAI(productName) {
        console.log(`[LiveTrend] Using AI-only for saturation check`);
        const client = openAIService.getClient();
        const response = await client.chat.completions.create({
            model: openAIService.deploymentName,
            messages: [{
                    role: 'system',
                    content: `Estimate market saturation for: ${productName}. Return JSON with saturationLevel (low/medium/high) and estimated competitors count.`
                }]
        });
        const content = response.choices[0].message.content;
        return { ...JSON.parse(content || '{}'), source: 'ai_fallback' };
    }
    async fallbackToAIOnly(category) {
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
                messages: messages,
            });
            const content = result.choices[0].message.content;
            if (!content)
                throw new Error("No content from AI");
            const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleanJson);
            return data.products.map((p) => ({
                ...p,
                images: [`https://via.placeholder.com/600x600.png?text=${encodeURIComponent(p.name)}`],
                source: 'ai_fallback'
            }));
        }
        catch (error) {
            console.error(`[LiveTrend] AI fallback failed: ${error.message}`);
            return [];
        }
    }
}
