import { runQuery } from "./BigQueryClient.js";
export class TrendsRepo {
    async getLatestRisingTermsByCountry(countryName) {
        const query = `
            WITH latest AS (
            SELECT MAX(refresh_date) AS max_date
            FROM \`bigquery-public-data.google_trends.international_top_rising_terms\`
            WHERE country_name = @countryName
            )
            SELECT
            CAST(t.refresh_date AS STRING) AS refresh_date,
            t.country_name,
            t.term,
            t.rank,
            t.score
            FROM \`bigquery-public-data.google_trends.international_top_rising_terms\` t
            CROSS JOIN latest
            WHERE t.country_name = @countryName
            AND t.refresh_date = latest.max_date
            ORDER BY t.rank ASC
            LIMIT 100
        `;
        return runQuery(query, { countryName });
    }
    async searchRisingTerms(keyword, countryName) {
        // Search for terms containing the keyword in the last 30 days
        const query = `
            SELECT
                CAST(refresh_date AS STRING) AS refresh_date,
                country_name,
                term,
                rank,
                score
            FROM \`bigquery-public-data.google_trends.international_top_rising_terms\`
            WHERE country_name = @countryName
              AND refresh_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 1000 DAY)
              AND LOWER(term) LIKE @keywordPattern
            ORDER BY refresh_date DESC, rank ASC
            LIMIT 100
        `;
        // Add wildcards for LIKE operator
        const keywordPattern = `%${keyword.toLowerCase()}%`;
        return runQuery(query, { countryName, keywordPattern });
    }
}
