# 🧠 Workflow 3: The Optimization Engine (The Brain)

**Objective:** To continuously analyze financial performance, maximize Return on Ad Spend (ROAS), and make data-driven decisions to Scale or Kill products.
**Trigger:** Periodic Schedule (Every 6 Hours) OR "Budget Exhausted" Alert.
**Owner:** Analytics Agent (Analyst) & Marketing Agent (Executor)

---

## 📊 Workflow Diagram

```mermaid
graph TD
    subgraph "Trigger: Schedule"
        Cron[Cron Job / Timer] -->|Event: OPTIMIZATION_TICK| Analyst[Phase 1: Analytics Agent]
    end

    subgraph "Phase 1: Data Aggregation"
        Analyst -->|Tools: Meta Ads API| Ads[Fetch Spend & Clicks]
        Analyst -->|Tools: Shopify API| Sales[Fetch Revenue & Orders]
        Ads & Sales -->|Tools: Calculator| ROAS[Compute ROAS & Net Profit]
        ROAS -->|Event: DATA_READY| Decision{Phase 2: Decision Logic}
    end

    subgraph "Phase 2: The Rules"
        Decision -- "Spend > $50 & 0 Orders" --> Kill[Kill Candidate]
        Decision -- "ROAS < 1.5 (Loss)" --> Kill
        Decision -- "ROAS > 3.0 (Winner)" --> Scale[Scale Candidate]
        Decision -- "ROAS 1.5-3.0 (Mid)" --> Hold[Hold Candidate]
    end

    subgraph "Phase 3: Execution"
        Kill -->|Tools: Meta Ads API| Pause[Action: Pause Ad Set]
        Pause -->|Event: AD_PAUSED| Report
        
        Scale -->|Tools: Meta Ads API| Boost[Action: Increase Budget 20%]
        Boost -->|Event: BUDGET_INCREASED| Report

        Hold -->|Tools: GenAI Image| Creative[Action: Generate New Creative]
        Creative -->|Event: CREATIVE_REQUESTED| Report
    end

    subgraph "Phase 4: Strategic Review"
        Report[Log Decision] -->|Tools: DB Ledger| DB[Save Snapshot]
        DB -->|Event: OPTIMIZATION_COMPLETE| Done[End: Cycle Complete]
    end
```

---

## 📝 Detailed Steps & Technical Actions

### Phase 1: Data Aggregation (The Truth)
*   **Actor:** `AnalyticsAgent`
*   **Trigger Event:** `OPTIMIZATION_TICK` (Cron Job)
*   **MCP Tools / Actions:**
    *   `meta_ads.get_insights(date_preset="today")`: Fetch Spend, Impressions, Clicks, CTR.
    *   `shopify.get_sales_report(date_preset="today")`: Fetch Revenue, Orders.
    *   `calculator.calculate_roas(revenue, spend)`: Compute ROAS.
    *   `calculator.calculate_net_profit(revenue, spend, cogs, fees)`: Compute Real Profit.
*   **Logic:**
    1.  **Attribution:** Match Shopify Orders to Ad Campaigns (using UTM tags).
    2.  **Sanity Check:** Ensure Ad Spend data is up-to-date (Meta API often lags 15 mins).
*   **Output Event:** `DATA_READY`
    *   **Payload:** `{ "campaign_id": "fb_555", "spend": 100, "revenue": 250, "roas": 2.5, "cpa": 12.50 }`

### Phase 2: Decision Logic (The Rules)
*   **Actor:** `AnalyticsAgent`
*   **Trigger Event:** `DATA_READY`
*   **Logic:**
    *   **Kill Rule:** If Spend > $50 AND Orders = 0 -> **KILL**.
    *   **Kill Rule:** If Spend > $100 AND ROAS < 1.5 (Break-even) -> **KILL**.
    *   **Scale Rule:** If ROAS > 3.0 AND CPA < $15 -> **SCALE** (Increase Budget 20%).
    *   **Optimize Rule:** If ROAS is 1.5 - 3.0 -> **HOLD** (Request new creatives).
*   **Output Event:** `DECISION_MADE`
    *   **Payload:** `{ "action": "SCALE", "campaign_id": "fb_555", "reason": "High ROAS (3.5)" }`

### Phase 3: Execution (The Hands)
*   **Actor:** `MarketingAgent`
*   **Trigger Event:** `DECISION_MADE`
*   **MCP Tools / Actions:**
    *   `meta_ads.update_budget(campaign_id, increase_by_percent=20)`: Scale.
    *   `meta_ads.pause_campaign(campaign_id)`: Kill.
    *   `llm.generate_ad_creative(feedback)`: Generate new angles for "Optimize" phase.
*   **Logic:**
    1.  **Safety Check:** Never increase budget more than 1x per 24h (prevents algorithm reset).
    2.  **Execution:** Call the API to apply changes.
*   **Output Event:** `BUDGET_INCREASED` / `AD_PAUSED`

### Phase 4: Strategic Review (The Pivot)
*   **Actor:** `CEOAgent`
*   **Trigger Event:** `AD_PAUSED` (Accumulated)
*   **Logic:**
    1.  **Product Health:** If all campaigns for "Neck Massager" are killed -> **Archive Product**.
    2.  **Pivot:** If 3 products fail in a row -> **Change Niche** (Trigger `WORKFLOW_GROWTH` with new category).
*   **Output Event:** `STRATEGY_UPDATED`

---

## 🚦 Exception Handling

| Scenario | Trigger Event | Handler Agent | Action |
| :--- | :--- | :--- | :--- |
| **Data Mismatch** | `DATA_ERROR` | `AnalyticsAgent` | If Shopify Revenue << Ad Spend (impossible ROAS), alert User to check Pixel. |
| **Runaway Spend** | `SPEND_ALERT` | `CEOAgent` | If Daily Spend > Global Cap ($500), **Emergency Stop** all ads. |
| **Ad Account Ban** | `ACCOUNT_DISABLED` | `MarketingAgent` | Pause all internal workflows. Alert User immediately via SMS/Email. |
