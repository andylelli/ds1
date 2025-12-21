# 🧠 03. Analytics Pipeline (The CFO)

**Status:** Draft
**Date:** December 2025
**Objective:** Aggregate fragmented financial data into a single "Source of Truth" (`ledger` table) to enable real-time P&L analysis.

## 1. The Problem
Data is scattered across different agents and external APIs:
*   **Ad Spend:** Hidden in Meta/TikTok APIs or `MarketingAgent` logs.
*   **COGS:** Known only to `SupplierAgent`.
*   **Revenue:** Lives in Shopify or `OperationsAgent`.
*   **Result:** We cannot calculate *True Profit* per product in real-time.

## 2. The Solution: The Financial Ledger

We introduce a double-entry style bookkeeping system in Postgres. Every financial event is recorded as a transaction.

### 2.1 Database Schema

```sql
CREATE TABLE ledger (
  id SERIAL PRIMARY KEY,
  transaction_date TIMESTAMP DEFAULT NOW(),
  type VARCHAR(50) NOT NULL,        -- INCOME, EXPENSE
  category VARCHAR(50) NOT NULL,    -- SALE, AD_SPEND, COGS, SHIPPING, FEE
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Context
  product_id INT REFERENCES products(id),
  order_id VARCHAR(255),            -- For Sales/COGS
  campaign_id VARCHAR(255),         -- For Ad Spend
  source VARCHAR(100)               -- e.g., 'ShopifyWebhook', 'MetaAdsAPI'
);

CREATE INDEX idx_ledger_product ON ledger(product_id);
CREATE INDEX idx_ledger_date ON ledger(transaction_date);
```

### 2.2 The Analytics Agent's Role

The `AnalyticsAgent` acts as the **CFO (Chief Financial Officer)**. It does not just "report"; it actively *reconciles* data.

#### Workflow:
1.  **Real-time:** Listens for `ORDER_PAID` events.
    *   Action: Insert `INCOME` (Sale Amount).
    *   Action: Insert `EXPENSE` (Stripe Fee).
2.  **Real-time:** Listens for `ORDER_SHIPPED` events.
    *   Action: Insert `EXPENSE` (COGS + Shipping).
3.  **Hourly:** Polls Meta/TikTok Ads API.
    *   Action: Insert `EXPENSE` (Ad Spend) linked to `product_id`.

## 3. Key Metrics & Formulas

The Dashboard will query the `ledger` table to calculate:

*   **Gross Profit:** $\sum \text{Income (Sale)} - \sum \text{Expense (COGS)}$
*   **Net Profit:** $\text{Gross Profit} - (\sum \text{Ad Spend} + \sum \text{Fees})$
*   **ROAS (Return on Ad Spend):** $\frac{\text{Total Revenue}}{\text{Total Ad Spend}}$
*   **POAS (Profit on Ad Spend):** $\frac{\text{Gross Profit}}{\text{Total Ad Spend}}$

## 4. Implementation Plan

### Phase 1: Schema Setup
1.  Create `ledger` table in Postgres.
2.  Update `PersistencePort` with `recordTransaction(tx)`.

### Phase 2: Event Listeners
1.  Update `AnalyticsAgent` to subscribe to `ORDER_PAID` and `ORDER_SHIPPED`.
2.  Implement the logic to extract financial values from these payloads.

### Phase 3: Ad Spend Poller
1.  Create a Cron Job (or `setInterval`) in `AnalyticsAgent`.
2.  Every hour, fetch spend from `AdsPlatformPort` and record it in the ledger.
