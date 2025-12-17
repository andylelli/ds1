import { runQuery } from "./BigQueryClient.js";

export type RisingTermRow = {
  refresh_date: string;     // YYYY-MM-DD
  country_name: string;     // e.g. "United Kingdom"
  term: string;             // trending search term
  rank: number;             // 1..25
  score?: number;           // sometimes present depending on table
};

export class TrendsRepo {
    async getLatestRisingTermsByCountry(countryName: string): Promise<RisingTermRow[]> {
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
            LIMIT 25
        `;
        return runQuery<RisingTermRow>(query, { countryName });
    }
}
