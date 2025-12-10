# 🧠 04. Strategy Engine (The CEO's Brain)

**Status:** Draft
**Date:** December 2025
**Objective:** Transform the CEO Agent from a simple task scheduler into a strategic decision-maker using an OODA Loop.

## 1. The Problem
Currently, the CEO Agent executes a linear script ("Research -> Source -> Market"). It lacks situational awareness.
*   **No Pivot:** If ads fail, it keeps spending.
*   **No Scaling:** If a product goes viral, it doesn't increase the budget.
*   **No Defense:** It doesn't react to cash flow crunches.

## 2. The Solution: The Strategy State Machine

The CEO will operate on a **State Machine** that dictates the company's "Posture".

### 2.1 Strategic Modes

| Mode | Trigger Condition | Goal | Actions |
| :--- | :--- | :--- | :--- |
| **DISCOVERY** | Default State | Find a Winner | High Research, Low Ad Spend ($50/day). |
| **SCALING** | Product ROAS > 3.0 | Maximize Profit | Increase Ad Spend (+20%/day), Bulk Order Inventory. |
| **DEFENSE** | Cash < $500 | Survival | Pause all Ads, Focus on Email Marketing, Liquidate Stock. |
| **PIVOT** | 3 Failed Products | Find New Niche | Switch Category (e.g., Pets -> Home), Reset Research. |

### 2.2 The OODA Loop

Every 6 hours (or on `DAILY_TICK`), the CEO runs this loop:

1.  **Observe:** Query `AnalyticsAgent` (Ledger) for:
    *   Cash on Hand
    *   Global ROAS
    *   Inventory Levels
2.  **Orient:** Compare metrics against the Rules Engine.
    *   *Example:* "Cash is healthy ($2000), but ROAS is dropping (1.2)."
3.  **Decide:** Select the Strategic Mode.
    *   *Decision:* "Switch from SCALING to DISCOVERY."
4.  **Act:** Issue commands.
    *   `marketing.pause_campaign(id)`
    *   `research.start_new_search()`

## 3. Implementation Plan

### Phase 1: The `StrategyEngine` Class
Create a pure logic class `src/core/strategy/StrategyEngine.ts`.
*   Input: `BusinessMetrics` object.
*   Output: `StrategyDirective` (Mode + List of Actions).

### Phase 2: CEO Integration
Update `CEOAgent` to:
1.  Subscribe to `DAILY_REPORT_GENERATED`.
2.  Pass the report to `StrategyEngine`.
3.  Execute the returned actions.

### Phase 3: Memory & Learning
Implement a `PostMortem` log. When a product is killed, the CEO writes *why* to the DB, preventing the same mistake (e.g., "Don't sell heated scarves in July").
