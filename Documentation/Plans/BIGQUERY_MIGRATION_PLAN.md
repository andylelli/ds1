# BigQuery Migration Plan: Google Trends Public Dataset

## 1. Context & Objective
**Goal**: Replace the unofficial `google-trends-api` (which requires personal credentials and is flaky) with the robust, enterprise-grade **Google BigQuery Public Dataset**.
**Source**: `bigquery-public-data.google_trends`
**Target**: `hale-treat-109915` (Google Cloud Project)

## 2. Authentication & Setup

### 2.1 Service Account
- **Project Name**: `My Project`
- **Project ID**: `hale-treat-109915`
- **Account Name**: `bq-trends-reader` (or similar)
- **Key File**: `hale-treat-109915-fb095f60b831.json`
    - **Location**: `C:\DropShip\` (Parent directory, outside repo)
    - **Strategy**: Keep key outside repository to prevent accidental commits.
- **Required Roles**:
    - `roles/bigquery.jobUser` (Run queries)
    - `roles/bigquery.dataViewer` (Read public datasets)

### 2.2 Environment Configuration
- **Local Dev**:
    - Set `GOOGLE_APPLICATION_CREDENTIALS` to `C:\DropShip\hale-treat-109915-fb095f60b831.json`.
- **Production**:
    - Inject credentials via Secret Manager or Environment Variable (JSON string).

### 2.3 Dependencies
- Install `@google-cloud/bigquery`.

## 3. Schema & Data Source

### 3.1 Target Table
We will query the **International Top Rising Terms** table:
`bigquery-public-data.google_trends.international_top_rising_terms`

- **Default Country**: `United Kingdom` (Mapped from user preference "GB").

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

### 4.2 Adapter Implementation (New Strategy)
We will create a **new** adapter `src/infra/trends/BigQueryTrendAdapter.ts` implementing `TrendAnalysisPort`.
- **Legacy**: The existing `LiveTrendAdapter.ts` (using `google-trends-api`) will be preserved as-is but decoupled from the active workflow.
- **Interface Compliance**: The new adapter must implement all methods of `TrendAnalysisPort`:
    1.  `analyzeTrend(category)`: Main logic using BigQuery rising terms.
    2.  `findProducts(category)`: Can reuse `analyzeTrend` logic to return product-like terms.
    3.  `checkSaturation(productName)`: Return a neutral/default response (or check if term is *declining* in BigQuery) as this is harder to determine from "rising" lists.

```typescript
// src/infra/trends/BigQueryTrendAdapter.ts
export class BigQueryTrendAdapter implements TrendAnalysisPort {
    // ... implementation using BigQueryTrendsRepo
}
```

### 4.3 Service Factory & Agent Integration
The `ServiceFactory` is the central place where adapters are instantiated.
- **File**: `src/core/bootstrap/ServiceFactory.ts`
- **Action**:
    1.  Import `BigQueryTrendAdapter`.
    2.  In `createAdapter`, case `'TrendAdapter'`, replace `new LiveTrendAdapter(...)` with `new BigQueryTrendAdapter(...)`.
- **MCP Impact**: `TrendMcpWrapper` depends on the `TrendAnalysisPort` interface, so it requires **no changes** as long as the new adapter implements the interface correctly.

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
- [ ] Create `src/infra/trends/BigQueryTrendAdapter.ts` (New Adapter).
- [ ] Update Agent Code to inject `BigQueryTrendAdapter` instead of `LiveTrendAdapter`.
- [ ] Update `.env` with `GCP_PROJECT_ID`.
- [ ] Smoke Test: Run a query for "United Kingdom" and verify results.
