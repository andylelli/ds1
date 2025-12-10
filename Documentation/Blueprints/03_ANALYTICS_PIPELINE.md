# 🧠 Deep Think: Analytics & Reporting Pipeline

**Status:** Draft
**Date:** December 2025
**Objective:** Aggregate fragmented data from all agents into a single "Source of Truth" for P&L (Profit & Loss) analysis.

## 1. The Problem
Data is scattered:
*   **Ad Spend:** Inside `MarketingAgent` logs (or Meta API).
*   **COGS (Cost of Goods):** Inside `SupplierAgent` logs (or AliExpress).
*   **Revenue:** Inside `OperationsAgent` (or Shopify).
*   **Fees:** Stripe/PayPal fees are often ignored in simulation.

**Result:** We don't know our *True Profit*. We might be scaling a product that is actually losing money after fees.

## 2. The Solution: The Data Warehouse (Lite)

We need a centralized `FinancialLedger` where every transaction is recorded.

### 2.1 The Ledger Schema

We move from "Daily Summaries" to "Transaction-Level" recording.

```json
{
  "id": "txn_999",
  "timestamp": "2025-12-04T14:00:00Z",
  "type": "EXPENSE", // or INCOME
  "category": "AD_SPEND", // COGS, SHIPPING, MERCHANT_FEE, SALE_REVENUE
  "amount": 15.50,
  "currency": "USD",
  "relatedEntityId": "prod_001", // Which product caused this?
  "source": "Meta Ads Manager"
}
```

### 2.2 The Analytics Agent's New Role

The `AnalyticsAgent` stops being a "Reporter" and starts being a "Controller".

**Tasks:**
1.  **Reconciliation:** Every hour, fetch spend from Meta/TikTok and revenue from Shopify.
2.  **Attribution:** Match Ad Spend to specific Orders (using UTM parameters) to calculate *Product-Level ROAS*.
3.  **Forecasting:** Predict cash flow issues. "At this burn rate, we run out of cash in 4 days."

### 2.3 The Dashboard (Frontend)

The `admin.html` needs a "Finance Tab" powered by this Ledger.

*   **Real-Time P&L:** Revenue - (COGS + Ad Spend + Shipping + Fees) = Net Profit.
*   **Unit Economics:**
    *   Selling Price: $50
    *   COGS: -$10
    *   Shipping: -$5
    *   CPA (Ad Cost): -$20
    *   Fees: -$1.50
    *   **Net:** $13.50 (27% Margin)

## 3. Implementation Plan

### Phase 1: The `Ledger` Class
Create `src/lib/ledger.js`.
*   `recordTransaction(type, amount, category, meta)`
*   `getDailyPnl(date)`

### Phase 2: Agent Integration
*   `MarketingAgent` calls `Ledger.record('EXPENSE', cost, 'AD_SPEND')` every time it spends budget.
*   `OperationsAgent` calls `Ledger.record('INCOME', price, 'SALE')` every time an order is paid.
*   `OperationsAgent` calls `Ledger.record('EXPENSE', cost, 'COGS')` every time it fulfills an order.

### Phase 3: Visualization
Update `src/index.js` (API) to serve `/api/financials`.
Update `admin.html` to chart this data using Chart.js.
