# Reference: Google Ads Adapter Implementation

**Status:** Active (Live)
**Owner:** Product Research Agent Team
**Implementation:** `src/infra/ads/GoogleAds/LiveAdsAdapter.ts` & `src/infra/ads/GoogleAds/MockAdsAdapter.ts`

---

## 1. Objective
To give the **Product Research Agent** and **Marketing Agent** access to the Google Ads platform for:
1.  **Campaign Management**: Creating, listing, and stopping campaigns.
2.  **Keyword Intelligence**: Accessing search volume and CPC data.

---

## 2. Architecture & Integration

### The Adapters

#### A. Live Adapter (`LiveAdsAdapter`)
*   **Location:** `src/infra/ads/GoogleAds/LiveAdsAdapter.ts`
*   **Library:** `google-ads-api`
*   **Usage:** Used in `live` mode to interact with real Google Ads accounts.

#### B. Mock Adapter (`MockAdsAdapter`)
*   **Location:** `src/infra/ads/GoogleAds/MockAdsAdapter.ts`
*   **Usage:** Used in `simulation` mode.
*   **Behavior:**
    *   **Campaigns:** Stored in-memory.
    *   **Metrics:** Returns randomized search volume (0-10k) and CPC ($0-$2) data to simulate market research.

### Capabilities

| Method | Live Status | Mock Status | Description |
| :--- | :--- | :--- | :--- |
| `createCampaign` | 🟢 Active | 🟢 Active | Creates a Search campaign (Paused in Live, Active in Mock). |
| `listCampaigns` | 🟢 Active | 🟢 Active | Lists campaigns. |
| `stopCampaign` | 🟢 Active | 🟢 Active | Pauses/Stops a campaign. |
| `getKeywordMetrics` | 🟡 Planned | 🟢 Active | Returns keyword data (Real API vs Randomized). |

---

## 3. Configuration

The adapter requires the following environment variables to be set in `.env`:

```env
GOOGLE_ADS_CLIENT_ID=...
GOOGLE_ADS_CLIENT_SECRET=...
GOOGLE_ADS_DEVELOPER_TOKEN=...
GOOGLE_ADS_REFRESH_TOKEN=...
GOOGLE_ADS_CUSTOMER_ID=... (The account ID to act on behalf of)
```

### Logging
*   **Activity Log (DB)**: Errors are logged to the `activity_log` table under the `marketing` category.
*   **External Log (File)**: Successful API calls are logged to `logs/{mode}/external.log` with the prefix `[GoogleAds]`.

---

## 4. Implementation Details

### Initialization
The adapter initializes the `GoogleAdsApi` client in the constructor. If credentials are missing, it logs a warning but does not throw until a method is called.

### Campaign Creation
Campaigns are always created in a **PAUSED** state for safety.
1.  Creates a `CampaignBudget` first.
2.  Creates a `Campaign` linked to that budget.
3.  Sets `advertising_channel_type` to `SEARCH`.
4.  Targets Google Search Network.

### Error Handling
All API calls are wrapped in `try/catch` blocks. Errors are logged to the database with full stack traces before being re-thrown to the caller.

---

## 5. Future Roadmap (Keyword Planner)

To fully realize the "Research" potential, the `getKeywordMetrics` method needs to be implemented using the `KeywordPlanIdeaService`.

**Planned Implementation:**
```typescript
const response = await customer.keywordPlanIdeas.generateKeywordIdeas({
  keyword_seed: { keywords: ['organic dog food'] },
  geo_target_constants: ['geoTargetConstants/2840'], // US
  language: 'languageConstants/1000', // English
  keyword_plan_network: 'GOOGLE_SEARCH',
});
```
This will provide:
*   `avg_monthly_searches`
*   `competition`
*   `average_cpc_micros`
