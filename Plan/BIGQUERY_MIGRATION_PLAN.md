# BigQuery Migration Plan: Google Trends Public Dataset

## 1. Context & Objective
**Goal**: Replace the unofficial `google-trends-api` (which requires personal credentials and is flaky) with the robust, enterprise-grade **Google BigQuery Public Dataset**.
**Source**: `bigquery-public-data.google_trends`
**Target**: `hale-treat-109915` (Google Cloud Project)

## 2. Authentication & Setup

### 2.1 Service Account
- **Account Name**: `bq-trends-reader` (or similar)
- **Key File**: `hale-treat-109915-fb095f60b831.json` (Already present in root/README reference)
- **Required Roles**:
    - `roles/bigquery.jobUser` (Run queries)
    - `roles/bigquery.dataViewer` (Read public datasets)

### 2.2 Environment Configuration
- **Local Dev**:
    - Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of the JSON key file.
    - **Security**: Ensure `*.json` keys are in `.gitignore`.
- **Production**:
    - Inject credentials via Secret Manager or Environment Variable (JSON string).

### 2.3 Dependencies
- Install `@google-cloud/bigquery`.

## 3. Schema & Data Source

### 3.1 Target Table
We will query the **International Top Rising Terms** table:
`bigquery-public-data.google_trends.international_top_rising_terms`

### 3.2 Data Mapping
| BigQuery Field | TypeScript Type | Description |
| :--- | :--- | :--- |
| `refresh_date` | `string` (YYYY-MM-DD) | The date of the trend data. |
| `country_name` | `string` | e.g., "United Kingdom", "United States". |
| `term` | `string` | The trending search query. |
| `rank` | `number` | 1-25 (1 is highest). |
| `score` | `number` | Trend score (if available). |

## 4. Ingestion Strategy (Architecture Update)

We will replace the current `LiveTrendAdapter` logic with a BigQuery-backed implementation.

### 4.1 New Infrastructure Components
1.  **`src/infra/bigquery/BigQueryClient.ts`**:
    - Singleton wrapper for the BigQuery SDK.
    - Handles authentication and job execution.
    - Default location: `US`.

2.  **`src/infra/trends/BigQueryTrendsRepo.ts`**:
    - Contains the SQL queries.
    - **Key Query**: `getLatestRisingTermsByCountry`
    - **Logic**:
        - CTE to find `MAX(refresh_date)` for the country (handles missing days).
        - `CROSS JOIN` to filter main table by that date.
        - Limit 25.

3.  **`src/infra/trends/TrendScoring.ts`**:
    - **Topic Filtering**: Simple string inclusion.
    - **Product Heuristic**:
        - **Blocklist**: "weather", "election", "lyrics", "who is", etc.
        - **Allowlist**: "buy", "price", "review", "best", etc.
    - **Ranking**: Sort by `rank` ASC.

### 4.2 Adapter Implementation
The `LiveTrendAdapter` will be updated to use `BigQueryTrendsRepo` instead of `google-trends-api`.

```typescript
// Pseudo-code for new Adapter
class BigQueryTrendAdapter implements TrendAnalysisPort {
    async analyzeTrend(category: string): Promise<Result> {
        // 1. Fetch raw rising terms from BigQuery
        const rawTerms = await repo.getLatestRisingTermsByCountry("United Kingdom");
        
        // 2. Filter by Category/Topic
        const filtered = scorer.filterByTopic(rawTerms, category);
        
        // 3. Filter for "Product-Likeness"
        const products = scorer.filterProductLikeness(filtered);
        
        // 4. Map to Domain Object
        return this.mapToTrendResult(products);
    }
}
```

## 5. Cost & Quota Management

### 5.1 Query Optimization
- **Partition Pruning**: Always filter by `refresh_date` (via the `MAX` date CTE).
- **Column Selection**: `SELECT` only necessary columns (`term`, `rank`, `score`), never `SELECT *`.

### 5.2 Caching Strategy
- **Frequency**: The public dataset is updated daily.
- **TTL**: Cache results for **12-24 hours**.
- **Mechanism**: Use the existing `ResearchStagingService` (Postgres) or in-memory Map to store results for a given (Country + Topic) key.

### 5.3 Limits
- **BigQuery Sandbox/Free Tier**: 1TB of query data processing per month is free.
- **Monitoring**: Log query bytes processed in `ActivityLogService`.

## 6. Implementation Checklist
- [ ] Install `@google-cloud/bigquery`.
- [ ] Create `src/infra/bigquery/BigQueryClient.ts`.
- [ ] Create `src/infra/trends/BigQueryTrendsRepo.ts` with SQL.
- [ ] Create `src/infra/trends/TrendScoring.ts` with heuristics.
- [ ] Refactor `LiveTrendAdapter.ts` to use the new Repo.
- [ ] Update `.env` with `GCP_PROJECT_ID`.
- [ ] Verify `.gitignore` includes `*.json`.
- [ ] Smoke Test: Run a query for "United Kingdom" and verify results.
