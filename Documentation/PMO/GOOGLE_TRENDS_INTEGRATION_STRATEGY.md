# Google Trends Integration Strategy (Live Mode)

## 1. Executive Summary
This document outlines the technical strategy for integrating the **Research Agent** with Google Trends in "Live Mode". 

**Critical Constraint:** The unofficial `google-trends-api` library has partial functionality issues. The "Passive Discovery" endpoints (`dailyTrends`, `realTimeTrends`) which normally return a list of "what's hot right now" are broken (returning 404 HTML errors).

**Strategic Pivot:** We will move from a **Passive Discovery** model (asking "What is trending?") to an **Active Exploration** model (asking "What is rising related to *X*?"). This relies on the `relatedQueries` and `interestOverTime` endpoints, which are verified to be fully functional.

---

## 2. The "Active Exploration" Workflow

### Phase 1: Seed-Based Discovery
Since we cannot simply fetch a global list of trending topics, we must "mine" for them using broad seed keywords.

1.  **Seed Selection:** The system will maintain a curated list of high-potential "Seed Keywords" that act as entry points into trending niches.
    *   *Examples:* "viral products", "tiktok made me buy it", "kitchen gadgets", "home decor trends", "gift ideas 2025", "amazon finds", "camping gear".
2.  **Execution:** The `LiveTrendAdapter` selects a seed (randomly or sequentially) and queries the `relatedQueries` API.
3.  **Extraction Logic:**
    *   The API returns two lists: "Top" (high volume, stable) and "Rising" (growing momentum).
    *   We **discard** "Top" queries as they are usually too generic (e.g., "amazon").
    *   We **target** "Rising" queries, specifically looking for:
        *   **"Breakout"**: Queries that have grown by >5000% (often new viral items).
        *   **High Growth**: Queries with >300% growth in the last period.

### Phase 2: Trend Validation
Once a candidate keyword (e.g., "mushroom lamp") is identified from the "Rising" list, it must be validated to ensure it's not a fleeting spike or a data anomaly.

1.  **Execution:** The adapter calls `interestOverTime` for the candidate keyword.
2.  **Timeframe:** We analyze the last 90 days (`startTime: Date.now() - 90 days`).
3.  **Analysis Logic:**
    *   **Data Points:** We retrieve the `timelineData` array (daily/weekly interest values 0-100).
    *   **Slope Calculation:** We compare the average interest of the last 14 days vs. the first 14 days of the period.
    *   **Volatility Check:** We ensure the graph isn't just a single day spike (which might indicate a news event rather than a product trend).
4.  **Decision:**
    *   **PASS:** Positive slope + sustained volume.
    *   **FAIL:** Negative slope or zero volume.

### Phase 3: Saturation Check
Before recommending a product, we check if it is already saturated.

1.  **Logic:** High absolute search volume combined with a "stable" or "declining" trend often indicates saturation.
2.  **Thresholds:**
    *   If `average_interest > 75` AND `growth < 10%` -> **High Saturation (Avoid)**.
    *   If `average_interest < 30` AND `growth > 50%` -> **Low Saturation (Opportunity)**.

---

## 3. API Reference Guide

We are using the `google-trends-api` Node.js library. Below are the specific methods, parameters, and data structures we will utilize.

### A. `relatedQueries` (Discovery Tool)
**Purpose:** To find specific product keywords based on broad category seeds.

*   **Function:** `googleTrends.relatedQueries(optionsObject)`
*   **Request Parameters:**
    ```javascript
    {
      keyword: string,  // The Seed Keyword (e.g., "viral products")
      geo: 'US',        // Target Market
      hl: 'en-US'       // Language
    }
    ```
*   **Response Structure (JSON):**
    ```json
    {
      "default": {
        "rankedList": [
          {
            "rankedKeyword": [ // "Rising" Queries (Index 0 is usually Rising, check library behavior)
              {
                "query": "galaxy projector",
                "value": 150,          // Relative growth score
                "formattedValue": "+150%" // Or "Breakout"
              }
            ]
          },
          {
            "rankedKeyword": [] // "Top" Queries (Index 1)
          }
        ]
      }
    }
    ```
*   **Integration Logic:**
    *   Parse `default.rankedList[0].rankedKeyword`.
    *   Filter for items where `formattedValue` === 'Breakout' OR `value` > 50.
    *   Exclude generic terms (blacklist check).

### B. `interestOverTime` (Validation Tool)
**Purpose:** To visualize the lifecycle of a trend and calculate growth metrics.

*   **Function:** `googleTrends.interestOverTime(optionsObject)`
*   **Request Parameters:**
    ```javascript
    {
      keyword: string,  // The Candidate Product (e.g., "galaxy projector")
      startTime: Date,  // new Date(Date.now() - (90 * 24 * 60 * 60 * 1000))
      geo: 'US'
    }
    ```
*   **Response Structure (JSON):**
    ```json
    {
      "default": {
        "timelineData": [
          {
            "time": "1672531200",
            "formattedTime": "Jan 1, 2023",
            "value": [45], // Interest score (0-100)
            "formattedValue": ["45"]
          },
          // ... array of data points
        ]
      }
    }
    ```
*   **Integration Logic:**
    *   Extract `value[0]` from each object in `timelineData`.
    *   Calculate **Moving Average (MA)** for the last 7 days.
    *   Calculate **Trend Direction**: `(Current MA - Previous MA) / Previous MA`.

### C. Error Handling & Live Mode Rules
*   **HTML Responses:** The API often returns HTML (404/429) when it fails or rate-limits.
    *   *Detection:* Check if `response.trim().startsWith('<')`.
    *   *Action:* **Throw Error**. Do not attempt to parse as JSON.
*   **Strict Live Mode:**
    *   If an API call fails, the `LiveTrendAdapter` must throw a `TrendAnalysisError`.
    *   **NO AI FALLBACK:** The system must not synthesize fake trend data. If Google is unreachable, the research session must pause or fail gracefully with a clear log message: `"Google Trends API unavailable. Aborting Live Research."`

---

## 4. Implementation Roadmap

1.  **Refactor `LiveTrendAdapter.ts`**:
    *   Remove `getRealTimeTrends` (Broken).
    *   Implement `discoverRisingTerms(seed)` using `relatedQueries`.
    *   Implement `validateTrend(keyword)` using `interestOverTime`.
2.  **Update `findProducts` Flow**:
    *   Step 1: Pick Seed.
    *   Step 2: `discoverRisingTerms(seed)`.
    *   Step 3: For each result, `validateTrend(result)`.
    *   Step 4: Return validated list.
3.  **Testing**:
    *   Use `test_trends.ts` to verify the "Active Exploration" loop produces valid JSON output.
