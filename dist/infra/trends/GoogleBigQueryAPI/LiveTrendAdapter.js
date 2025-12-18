import { TrendsRepo } from './TrendsRepo.js';
import { TrendScoring } from './TrendScoring.js';
export class LiveTrendAdapter {
    repo;
    scoring;
    country = "United Kingdom"; // Default from plan
    constructor(pool) {
        // Pool is accepted to maintain compatibility with ServiceFactory signature
        // We can add ActivityLogService later if needed
        this.repo = new TrendsRepo();
        this.scoring = new TrendScoring();
    }
    async analyzeTrend(category) {
        console.log(`[BigQueryTrend] Analyzing trend for category: ${category}`);
        try {
            let rawTerms;
            // If category is specific, search for it directly in BigQuery
            if (category && category.toLowerCase() !== 'general' && category.toLowerCase() !== 'all') {
                rawTerms = await this.repo.searchRisingTerms(category, this.country);
            }
            else {
                // Otherwise get the generic top 25
                rawTerms = await this.repo.getLatestRisingTermsByCountry(this.country);
            }
            // 2. Filter by Category/Topic (still useful for secondary filtering or if we fell back to generic)
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
        }
        catch (error) {
            console.error("[BigQueryTrend] Error analyzing trend:", error);
            throw error;
        }
    }
    async findProducts(category) {
        console.log(`[BigQueryTrend] Finding products for category: ${category}`);
        try {
            let rawTerms = [];
            const isSpecificSearch = category && category.toLowerCase() !== 'general' && category.toLowerCase() !== 'all';
            if (isSpecificSearch) {
                // 1. Try Primary Country (UK)
                rawTerms = await this.repo.searchRisingTerms(category, this.country);
                // 2. Fallback to US if no results found (US dataset is often larger/fresher)
                if (!rawTerms || rawTerms.length === 0) {
                    console.log(`[BigQueryTrend] No results in ${this.country}, trying United States...`);
                    rawTerms = await this.repo.searchRisingTerms(category, "United States");
                }
            }
            else {
                rawTerms = await this.repo.getLatestRisingTermsByCountry(this.country);
            }
            // NOTE: If we searched via SQL, we don't want to filter AGAIN by the exact string, 
            // because the SQL 'LIKE' is broader than our strict filterByTopic logic might be.
            // Let's skip filterByTopic if we did a specific search.
            let topicFiltered = rawTerms;
            if (!isSpecificSearch) {
                topicFiltered = this.scoring.filterByTopic(rawTerms, category);
            }
            if (!category || category.toLowerCase() === 'general' || category.toLowerCase() === 'all') {
                topicFiltered = this.scoring.filterByTopic(rawTerms, category);
            }
            const products = topicFiltered.filter(t => this.scoring.isLikelyProductTerm(t.term));
            const ranked = this.scoring.rankEmerging(products);
            return ranked.map(r => {
                const demandScore = 100 - (r.rank * 2);
                // Synthetic competition score (inverse of demand for now, or random)
                const competitionScore = Math.floor(Math.random() * 40) + 30;
                return {
                    name: r.term,
                    demandScore: demandScore,
                    competitionScore: competitionScore,
                    profitPotential: demandScore - (competitionScore * 0.5), // Simple heuristic
                    reason: `Rising term in ${this.country} (Rank ${r.rank})`
                };
            });
        }
        catch (error) {
            console.error("[BigQueryTrend] Error finding products:", error);
            // Rethrow configuration errors so the agent knows it's a system failure, not just "no results"
            if (error.message && error.message.includes("GCP_PROJECT_ID")) {
                throw error;
            }
            return [];
        }
    }
    async checkSaturation(productName) {
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
