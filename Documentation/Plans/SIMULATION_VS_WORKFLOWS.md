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
*   [ ] **Implement Staging Pause**: The simulation should PAUSE after Step 1 and wait for user approval via `staging.html`.
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
*   [ ] **Inventory Logic**: Currently assumes infinite inventory. Add stock checks.

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
*   [ ] **Implement The Loop**: The simulation should use the report to decide the *next* action (e.g., "Profit is low, kill ads" or "Profit is high, run again").

---

## 🛠️ Proposed Simulation Flow (v2)

To fully test the workflows, the simulation needs to be stateful and interruptible.

1.  **State 1: Researching**
    *   Agents find products.
    *   **STOP**. Save to DB. Status: `WAITING_FOR_APPROVAL`.
2.  **User Action (Manual)**
    *   User goes to `staging.html`.
    *   User clicks "Approve" on a product.
    *   Trigger: `RESUME_SIMULATION(product_id)`.
3.  **State 2: Launching**
    *   Sourcing -> Store -> Ads.
    *   Status: `ACTIVE_CAMPAIGN`.
4.  **State 3: Running (Loop)**
    *   Every "tick" (or minute):
        *   Simulate Traffic/Sales.
        *   Simulate Issues.
        *   Update Analytics.
    *   **Optimization Agent** runs periodically to adjust bids or pause ads.

## 📝 Next Steps for Developer

1.  Modify `simulation.js` to support a **Paused State**.
2.  Update `staging.html` / `staging.js` to trigger the resumption of the simulation.
3.  Enhance `OptimizationAgent` to actually modify active campaigns.
