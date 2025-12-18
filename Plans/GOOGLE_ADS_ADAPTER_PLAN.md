# 📅 Plan: Google Ads Adapter Implementation (Keyword Intelligence)

**Status:** Draft
**Owner:** Product Research Agent Team
**Target:** Tier 1 Integration (MVP)

---

## 1. Objective
To give the **Product Research Agent** "eyes" on actual search demand.
Currently, we rely on Google Trends (Relative Interest 0-100). We need **Google Ads Keyword Planner** data to get:
*   **Absolute Search Volume** (e.g., "10k-100k searches/month").
*   **CPC Estimates** (Cost Per Click = Commercial Intent proxy).
*   **Competition Index** (How saturated the ad space is).

This moves us from *"People are interested in this"* (Trends) to *"People are buying this"* (Ads).

---

## 2. Architecture & Integration

### The Adapter
We will implement a new adapter or extend the existing Trend infrastructure.
*   **Class:** `GoogleAdsResearchAdapter`
*   **Implements:** `TrendAnalysisPort` (or a specialized `SearchVolumePort` if we split interfaces later).
*   **Location:** `src/infra/search/GoogleAdsResearchAdapter.ts`

### MCP Tool Mapping
The Agent will access this via the standard MCP contract:

| MCP Tool | Google Ads API Service | Purpose |
| :--- | :--- | :--- |
| `mcp.search.scan(query)` | `KeywordPlanIdeaService.GenerateKeywordIdeas` | Get related keywords + volume for a seed term. |
| `mcp.search.volume(keywords)` | `KeywordPlanIdeaService.GenerateKeywordHistoricalMetrics` | Get precise volume history for specific terms. |

---

## 3. Account & Access Setup (The "Red Tape")

Google Ads API requires a strict setup process.

### Step 1: Google Ads Manager Account
1.  Create a **Manager Account** (MCC) at [ads.google.com/home/tools/manager-accounts/](https://ads.google.com/home/tools/manager-accounts/).
2.  Create a **Test Manager Account** for development (Critical: API calls to test accounts are free and don't require an approved Developer Token).

### Step 2: GCP Project & Credentials
1.  Go to Google Cloud Console.
2.  Enable **Google Ads API**.
3.  Create **OAuth 2.0 Credentials** (Client ID & Client Secret).
    *   *Application Type:* Desktop App (easiest for backend scripts) or Web App.

### Step 3: Developer Token
1.  In the Manager Account (Production), go to **Tools & Settings > Setup > API Center**.
2.  Apply for a **Basic Access** token.
    *   *Note:* While waiting for approval, use the token with the **Test Account**. It works immediately for test accounts.

### Step 4: Refresh Token Generation
1.  Run a one-time script (using `google-ads-api` library helper) to authorize the app and generate a **Refresh Token**.
2.  Store this token. We do *not* want to do 3-legged OAuth with a user every time. The Agent acts as a "Service Account" using this refresh token.

---

## 4. Technical Implementation Plan

### Phase 1: Configuration & Client
*   **Dependencies:** Install `google-ads-api` (Official Node.js client).
*   **Env Variables:**
    ```env
    GOOGLE_ADS_CLIENT_ID=...
    GOOGLE_ADS_CLIENT_SECRET=...
    GOOGLE_ADS_DEVELOPER_TOKEN=...
    GOOGLE_ADS_REFRESH_TOKEN=...
    GOOGLE_ADS_CUSTOMER_ID=... (The account ID to act on behalf of)
    ```

### Phase 2: The `scan` Method
Implement `generateKeywordIdeas`:
```typescript
const customer = client.Customer({ customer_id: '...' });
const response = await customer.keywordPlanIdeas.generateKeywordIdeas({
  keyword_seed: { keywords: ['organic dog food'] },
  geo_target_constants: ['geoTargetConstants/2840'], // US
  language: 'languageConstants/1000', // English
  keyword_plan_network: 'GOOGLE_SEARCH',
});
```

### Phase 3: Normalization
Map the complex Google response to our simple `Signal` schema:
*   `avg_monthly_searches` -> `Signal.data.volume`
*   `competition` -> `Signal.data.competition_index`
*   `average_cpc_micros` -> `Signal.data.cpc`

---

## 5. Risk & Mitigation

| Risk | Mitigation |
| :--- | :--- |
| **Quota Limits** | Basic Access allows 15,000 operations/day. Cache results heavily in `PersistencePort`. |
| **Token Expiry** | Handle Refresh Token rotation automatically (library usually handles this). |
| **Cost** | API use is free, but we need a valid Ads account. Ensure we don't accidentally create live campaigns (Use `validateOnly` flag where possible, though mostly relevant for mutations). |

---

## 6. Next Actions
1.  [ ] Set up Google Cloud Project.
2.  [ ] Generate Refresh Token.
3.  [ ] `npm install google-ads-api`.
4.  [ ] Create `src/infra/search/GoogleAdsResearchAdapter.ts`.
