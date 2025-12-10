# 🧠 Deep Think: Multi-Product Architecture

**Status:** Draft
**Date:** December 2025
**Objective:** Scale the system from managing 1 Product to a full Catalog (10-100 SKUs).

## 1. The Problem
The current `sandbox_db.json` and Agent logic assume a "One Product Store".
*   `MarketingAgent` assumes it's advertising "The Product".
*   `SupplierAgent` assumes it's ordering "The Inventory".
*   `ProductResearcher` overwrites the previous product when it finds a new one.

## 2. The Solution: Catalog Management

We need to treat the store as a collection of **Assets**, where each Product has its own lifecycle.

### 2.1 Database Schema Changes

#### `Products` Collection
```json
[
  {
    "id": "prod_001",
    "name": "Galaxy Projector",
    "status": "active",       // active, testing, killed, winner
    "lifecycleStage": "scaling",
    "metrics": {
      "cpa": 12.50,
      "roas": 3.2,
      "inventory": 150
    },
    "supplier": { "id": "sup_ali_99", "cost": 8.00 }
  },
  {
    "id": "prod_002",
    "name": "Heated Scarf",
    "status": "testing",
    "lifecycleStage": "launch",
    "metrics": { "cpa": 0, "roas": 0, "inventory": 0 }
  }
]
```

### 2.2 Agent Logic Updates

#### `ProductResearcher`
*   **Old:** Find a product -> Save to `db.product`.
*   **New:** Find a product -> **Append** to `db.products` with status `testing`.
*   **Constraint:** Max 3 products in `testing` phase at once (to save budget).

#### `MarketingAgent`
*   **Old:** "Optimize Ads" (Global).
*   **New:** Loop through `db.products.filter(p => p.status === 'active')`.
    *   Allocate budget per product based on ROAS.
    *   Kill products with ROAS < 1.5 after 3 days.

#### `OperationsAgent`
*   **Old:** `fulfillOrder()`
*   **New:** `fulfillOrder(order)` -> Check `order.items` to see *which* products to ship. Handle split shipments if needed.

### 2.3 The "Winner" Strategy
The system should automatically classify products:
1.  **Test:** Spend $50/day.
2.  **Analyze:** After 3 days, check ROAS.
3.  **Kill:** If ROAS < 1.5, mark status `killed`. Stop ads.
4.  **Scale:** If ROAS > 2.5, mark status `winner`. Increase budget.

## 3. Implementation Plan

### Phase 1: DB Migration
1.  Update `sandbox_db.json` to use an array for `products`.
2.  Update `DatabaseInterface` (if it exists) or `fs` calls to handle arrays.

### Phase 2: Agent Refactoring
1.  Update `MarketingAgent` to accept a `productId` argument for its tools.
2.  Update `simulation.js` to loop through active products during the "Marketing Step".

### Phase 3: Portfolio Dashboard
1.  Update `admin.html` to show a table of products instead of a single view.
2.  Show "Winners" vs "Losers" clearly.
