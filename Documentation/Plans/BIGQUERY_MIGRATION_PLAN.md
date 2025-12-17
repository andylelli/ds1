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

### 4.1 Directory Structure & Naming (Refined)
To ensure consistency and separation of concerns, we will restructure `src/infra/trends/` into subfolders:

1.  **`src/infra/trends/GoogleTrendsAPI/`** (Legacy)
    - Move existing `LiveTrendAdapter.ts` here.
    - Keeps the old logic isolated.

2.  **`src/infra/trends/GoogleBigQueryAPI/`** (New)
    - `LiveTrendAdapter.ts`: The new adapter implementation (same class name, different namespace).
    - `BigQueryClient.ts`: Singleton wrapper.
    - `TrendsRepo.ts`: SQL queries (renamed from `BigQueryTrendsRepo` for simplicity).
    - `TrendScoring.ts`: Heuristics and filtering.

### 4.2 Adapter Implementation
We will implement `src/infra/trends/GoogleBigQueryAPI/LiveTrendAdapter.ts`.

```typescript
// src/infra/trends/GoogleBigQueryAPI/LiveTrendAdapter.ts
import { TrendsRepo } from './TrendsRepo';
import { TrendScoring } from './TrendScoring';

export class LiveTrendAdapter implements TrendAnalysisPort {
    // ... implementation
}
```

### 4.3 Service Factory Updates
We will update `src/core/bootstrap/ServiceFactory.ts` to import the **new** adapter.

```typescript
// src/core/bootstrap/ServiceFactory.ts
// import { LiveTrendAdapter } from '../../infra/trends/GoogleTrendsAPI/LiveTrendAdapter.js'; // OLD (Commented out or removed)
import { LiveTrendAdapter } from '../../infra/trends/GoogleBigQueryAPI/LiveTrendAdapter.js'; // NEW

// ...
case 'TrendAdapter':
    return new LiveTrendAdapter(deps.db.getPool()); // Instantiates the BigQuery version
```

## 5. Cost & Quota Management
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
- [ ] **Restructure Folders**:
    - [ ] Create `src/infra/trends/GoogleTrendsAPI/`.
    - [ ] Move old `LiveTrendAdapter.ts` to `GoogleTrendsAPI/`.
    - [ ] Create `src/infra/trends/GoogleBigQueryAPI/`.
- [ ] **Install Dependencies**: `@google-cloud/bigquery`.
- [ ] **Implement New Adapter**:
    - [ ] `src/infra/trends/GoogleBigQueryAPI/BigQueryClient.ts`.
    - [ ] `src/infra/trends/GoogleBigQueryAPI/TrendsRepo.ts`.
    - [ ] `src/infra/trends/GoogleBigQueryAPI/TrendScoring.ts`.
    - [ ] `src/infra/trends/GoogleBigQueryAPI/LiveTrendAdapter.ts`.
- [ ] **Update System**:
    - [ ] Update `ServiceFactory.ts` to import the new adapter.
    - [ ] Update `.env` with `GCP_PROJECT_ID`.
- [ ] **Verification**:
    - [ ] Smoke Test: Run a query for "United Kingdom".
