# Simulation vs. Workflows: Gap Analysis

This document compares the current `simulation.js` implementation against the defined workflows (`01_GROWTH.md`, `02_OPERATIONS.md`, `03_OPTIMIZATION.md`) to identify gaps, missing manual approvals, and areas for improvement.

## 📊 Overview

| Workflow | Status | Simulation Coverage | Key Gaps |
| :--- | :--- | :--- | :--- |
| **01. Growth** | 🟡 Partial | Covers Research -> Sourcing -> Store -> Ads. | **Missing Manual Approval** (Staging). No "Competitor Analysis" detail. |
| **02. Operations** | 🟢 Good | Covers Fulfillment & Basic Support. | "Post-Sale Issues" are simulated well. |
| **03. Optimization** | 🔴 Weak | Basic "Report Generation" only. | No feedback loop (Optimization -> Growth). |

---

## 🔍 Detailed Comparison

### 1. Growth Engine (Product Launch)

**Workflow Definition:**
1.  **Research**: Trends -> Competitors -> `PRODUCT_FOUND`.
2.  **Approval**: CEO Review (`PRODUCT_APPROVED`).
3.  **Sourcing**: Find Supplier -> CEO Supplier Review (`SUPPLIER_APPROVED`).
4.  **Build**: Create Store Page.
5.  **Launch**: Create Ads -> `CAMPAIGN_STARTED`.

**Simulation Implementation:**
*   **Step 1 (Research)**: Calls `agents.research.findWinningProducts`.
    *   *Gap*: Does not simulate the "Trend -> Competitor" sub-steps visibly.
    *   *Gap*: **CRITICAL**. Automatically picks the first product (`winner = products[0]`). **Skips the Staging/Approval phase.**
*   **Step 2 (Sourcing)**: Calls `agents.supplier.findSuppliers`.
    *   *Gap*: Automatically selects the first supplier. No CEO review.
*   **Step 3 (Build)**: Calls `agents.store.createProductPage`.
*   **Step 4 (Marketing)**: Calls `agents.marketing.createAdCampaign` for 3 platforms.

**✅ Action Items:**
*   [x] **Implement Staging Pause**: The simulation should PAUSE after Step 1 and wait for user approval via `staging.html`.
*   [ ] **Implement Supplier Selection**: If multiple suppliers are found, allow selection or simulate CEO logic more deeply.

### 2. Operations Engine (Fulfillment & Support)

**Workflow Definition:**
1.  **Order**: Customer places order.
2.  **Fulfillment**: Agent fulfills order -> Tracking Number.
3.  **Support**: Agent handles tickets (Refunds, Questions).

**Simulation Implementation:**
*   **Step 5 (Sales)**: `simulateTraffic` generates orders based on ad spend and market events.
*   **Step 6 (Fulfillment)**: Loops through orders and calls `agents.ops.fulfillOrder`.
*   **Step 6.5 (Issues)**: `generateProblemEvents` creates random issues (Lost Package, Defective).
    *   `agents.support.handleTicket` and `agents.ops.handleShippingIssue` are called to resolve them.

**✅ Action Items:**
*   [x] **Inventory Logic**: Currently assumes infinite inventory. Add stock checks.

### 3. Optimization Engine (Analysis & Feedback)

**Workflow Definition:**
1.  **Analyze**: Review Sales, Ad Spend, and Margins.
2.  **Decide**: Kill bad ads, Scale good ads, Find new products.
3.  **Loop**: Trigger Growth or Operations workflows.

**Simulation Implementation:**
*   **Step 7 (Analytics)**: Calls `agents.analytics.generateReport`.
    *   Calculates Revenue and Profit.
    *   *Gap*: The simulation **ENDS** here. It does not loop back.

**✅ Action Items:**
*   [x] **Implement The Loop**: The simulation should use the report to decide the *next* action (e.g., "Profit is low, kill ads" or "Profit is high, run again").

---

## 📅 Phased Implementation Plan

To bridge the gap between the current linear simulation and the desired stateful workflows, we will execute the following phases.

### Phase 1: The Approval Gate (Manual Intervention)
**Objective:** Stop the simulation from auto-launching products. Force the user to approve products in the Staging UI.

1.  **Modify `simulation.js`**:
    *   Split `runProductLifecycle` into two parts: `runResearchPhase()` and `runLaunchPhase(productId)`.
    *   `runResearchPhase` should save products to DB with status `WAITING_FOR_APPROVAL` and then **EXIT**.
2.  **Update API**:
    *   Create `POST /api/simulation/approve` endpoint.
    *   This endpoint accepts a `productId`, updates status to `APPROVED`, and triggers `runLaunchPhase(productId)`.
3.  **Update UI (`staging.html`)**:
    *   Ensure the "Approve" button calls the new API endpoint.
    *   Add visual indicators for "Researching..." vs "Waiting for Approval".

### Phase 2: Continuous Operation (The Loop)
**Objective:** Move from a "one-off run" to a continuous heartbeat that simulates time passing.

1.  **Create `SimulationEngine` Class**:
    *   Manage a `tick()` loop (e.g., 1 tick = 1 hour of game time).
    *   Maintain state: `current_hour`, `active_campaigns`, `inventory`.
2.  **Traffic Simulation**:
    *   Move `simulateTraffic` inside the tick loop.
    *   Traffic should depend on *active ads* in the DB, not just local variables.
3.  **Event Injection**:
    *   Randomly inject "Market Events" or "Operational Issues" during ticks, rather than pre-scripting them.

### Phase 3: The Optimization Feedback Loop
**Objective:** Enable the Optimization Agent to autonomously manage the business based on data.

1.  **Analytics Trigger**:
    *   Every X ticks (e.g., "Daily"), trigger `agents.analytics.generateReport()`.
2.  **Decision Logic**:
    *   Feed the report to the **Optimization Agent**.
    *   Implement tools for the agent to:
        *   `update_ad_budget(campaign_id, amount)`
        *   `pause_campaign(campaign_id)`
        *   `request_new_research()`
3.  **Self-Correction**:
    *   If profit < 0, the agent should kill ads.
    *   If profit > target, the agent should scale budget.

### Phase 4: Inventory & Supply Chain
**Objective:** Add realism to the Operations engine.

1.  **Inventory Tracking**:
    *   Deduct stock on `ORDER_RECEIVED`.
    *   Fail orders if `stock == 0`.
2.  **Restocking**:
    *   Implement `agents.supplier.orderStock()`.
    *   Simulate shipping time (e.g., stock arrives in 5 ticks).

## ✅ Success Criteria
*   User can reject bad products in Staging.
*   Simulation runs indefinitely until stopped.
*   System recovers from negative profit automatically (Optimization Agent kills bad ads).
