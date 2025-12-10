# 🧠 Deep Think: Strategy & Self-Correction Engine

**Status:** Draft
**Date:** December 2025
**Objective:** Give the CEO Agent a "Brain" to make high-level strategic decisions (Pivot, Scale, Kill) based on data, rather than just executing a loop.

## 1. The Problem
Currently, the `CEOAgent` is a glorified task scheduler. It runs "Research -> Source -> Market" blindly.
*   **No Pivot:** If ads fail for 5 days straight, it keeps spending money.
*   **No Scaling:** If a product goes viral, it doesn't know to double the budget.
*   **No Diagnosis:** It doesn't know *why* something failed (Price? Creative? Audience?).

## 2. The Solution: The Strategy State Machine

We need a logic layer that evaluates the **Business Health** and transitions the company between different "Strategic Modes".

### 2.1 Strategic Modes

1.  **Discovery Mode (Default):**
    *   *Goal:* Find a winning product.
    *   *Action:* High research volume, low ad spend ($50/day), rapid testing.
2.  **Scaling Mode:**
    *   *Goal:* Maximize profit on a winner.
    *   *Action:* Increase ad spend (+20% daily), negotiate bulk supplier deals, expand to new ad platforms.
3.  **Defense Mode:**
    *   *Goal:* Protect margins during a downturn (or high competition).
    *   *Action:* Cut ad spend, focus on Retention/Email, reduce prices to clear inventory.
4.  **Pivot Mode:**
    *   *Goal:* Abandon a failing niche.
    *   *Action:* Liquidate inventory, reset `ProductResearcher` with new criteria (e.g., "Switch from Pets to Home Decor").

### 2.2 The Decision Loop (OODA Loop)

The CEO Agent will run an **OODA Loop** (Observe, Orient, Decide, Act) every 24 simulated hours.

#### Step 1: Observe (Data Ingestion)
Gather metrics from `AnalyticsAgent`:
*   `Daily Profit`
*   `Global ROAS` (Return on Ad Spend)
*   `Cash on Hand`
*   `Inventory Levels`

#### Step 2: Orient (Health Check)
Compare metrics against KPIs:
*   *Is ROAS > 2.5?* -> **Healthy**.
*   *Is Cash < $500?* -> **Critical**.
*   *Is Inventory > 1000 units but Sales = 0?* -> **Overstocked**.

#### Step 3: Decide (Strategy Selection)
*   *If* `ROAS > 3.0` *AND* `Cash > $2000`: **Switch to Scaling Mode**.
*   *If* `ROAS < 1.0` for 3 days: **Trigger Kill Product**.
*   *If* `Cash < $200`: **Switch to Defense Mode** (Stop all ads, rely on organic).

#### Step 4: Act (Directives)
Issue commands to other agents:
*   To `MarketingAgent`: "Increase budget to $500/day."
*   To `SupplierAgent`: "Negotiate 10% off for 500 units."

## 3. Implementation Plan

### Phase 1: The `StrategyEngine` Class
Create `src/lib/strategyEngine.js`.
It should take `metrics` as input and return a `StrategyDirective`.

```javascript
// Example Output
{
  mode: "SCALING",
  actions: [
    { agent: "MarketingAgent", task: "increase_budget", params: { amount: 500 } },
    { agent: "SupplierAgent", task: "bulk_order", params: { units: 200 } }
  ],
  reasoning: "ROAS is 4.2, we are leaving money on the table."
}
```

### Phase 2: CEO Integration
Update `CEOAgent` to call `StrategyEngine.evaluate(metrics)` at the start of every day.

### Phase 3: "Post-Mortem" Analysis
If a product is killed, the CEO must write a "Lesson Learned" to `memory.json` so it doesn't make the same mistake (e.g., "Don't sell heated scarves in July").
