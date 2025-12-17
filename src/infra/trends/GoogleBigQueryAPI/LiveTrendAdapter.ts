import { TrendAnalysisPort } from '../../../core/domain/ports/TrendAnalysisPort.js';
import { TrendsRepo } from './TrendsRepo.js';
import { TrendScoring } from './TrendScoring.js';
import { Pool } from 'pg';

export class LiveTrendAdapter implements TrendAnalysisPort {
    private repo: TrendsRepo;
    private scoring: TrendScoring;
    private country: string = "United Kingdom"; // Default from plan

    constructor(pool: Pool) {
        // Pool is accepted to maintain compatibility with ServiceFactory signature
        // We can add ActivityLogService later if needed
        this.repo = new TrendsRepo();
        this.scoring = new TrendScoring();
    }

    async analyzeTrend(category: string): Promise<any> {
        console.log(`[BigQueryTrend] Analyzing trend for category: ${category}`);
        
        try {
            // 1. Fetch raw rising terms
            const rawTerms = await this.repo.getLatestRisingTermsByCountry(this.country);
            
            // 2. Filter by Category/Topic
            const topicFiltered = this.scoring.filterByTopic(rawTerms, category);
            
            // 3. Filter for "Product-Likeness"
            const products = topicFiltered.filter(t => this.scoring.isLikelyProductTerm(t.term));
            
            // 4. Rank
            const ranked = this.scoring.rankEmerging(products);

            // 5. Calculate a synthetic "Trend Score" based on rank
            // Rank 1 = 100, Rank 25 = 50 (roughly)
            const topRank = ranked.length > 0 ? ranked[0].rank : 25;
            const trendScore = Math.max(0, 100 - (topRank * 2)); 

            return {
                category,
                trendScore,
                direction: trendScore > 60 ? 'rising' : 'stable',
                interestOverTime: [], // Not available in this dataset
                risingQueries: ranked.map(r => ({ query: r.term, value: r.rank })),
                topQueries: ranked.map(r => ({ query: r.term, value: r.rank })),
                recommendation: trendScore > 50 ? 'PROCEED' : 'CAUTION',
                source: 'google_bigquery_public'
            };

        } catch (error) {
            console.error("[BigQueryTrend] Error analyzing trend:", error);
            throw error;
        }
    }

    async findProducts(category: string): Promise<any[]> {
        console.log(`[BigQueryTrend] Finding products for category: ${category}`);
        try {
            const rawTerms = await this.repo.getLatestRisingTermsByCountry(this.country);
            const topicFiltered = this.scoring.filterByTopic(rawTerms, category);
            const products = topicFiltered.filter(t => this.scoring.isLikelyProductTerm(t.term));
            const ranked = this.scoring.rankEmerging(products);

            return ranked.map(r => ({
                name: r.term,
                score: 100 - (r.rank * 2), // Synthetic score
                reason: `Rising term in ${this.country} (Rank ${r.rank})`
            }));
        } catch (error) {
            console.error("[BigQueryTrend] Error finding products:", error);
            return [];
        }
    }

    async checkSaturation(productName: string): Promise<any> {
        // BigQuery "Rising Terms" doesn't give saturation directly.
        // If it's in the rising list, it's likely NOT saturated yet (it's growing).
        // If it's not in the list, we don't know.
        
        return {
            product: productName,
            saturationLevel: 'UNKNOWN',
            message: 'Saturation data not available from Rising Terms dataset.',
            score: 0
        };
    }
}
