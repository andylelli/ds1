# Simulated 3rd Party Endpoints

This document lists the API endpoints required to simulate the external ecosystem for Project DS1.

> **Note:** As of Dec 5, 2025, the system uses a **Hexagonal Architecture (Ports & Adapters)**.
> *   **Mock Mode:** Agents use "Mock Adapters" (e.g., `MockShopAdapter`) that return simulated data from local JSON files or memory.
> *   **Live Mode:** Agents use "Live Adapters" (e.g., `LiveShopAdapter`) that connect to real external APIs (Shopify, Meta, etc.).
> *   **Switching:** Controlled by `config.json` (e.g., `"shopMode": "live"`).

## 1. Persistence Layer (Database)
*Simulates: Postgres, Cosmos DB*

*   **Interface:** `PersistencePort`
*   **Adapters:**
    *   `MockAdapter`: Reads/Writes to `sandbox_db.json`.
    *   `PostgresAdapter`: Connects to a real PostgreSQL database. Supports dual-pool (Live vs. Simulator) via `source` parameter.
*   **Inspector:**
    *   `GET /api/db/table/:table?db=live|sim`: Allows the Admin Panel to inspect data from either the Live or Simulator database pool.

## 2. Marketplace Data Provider (Product Research Agent)
*Simulates: Amazon API, JungleScout, Google Trends*

*   **Interface:** `TrendAnalysisPort`, `CompetitorAnalysisPort`
*   **Adapters:** `MockTrendAdapter`, `LiveTrendAdapter` (Google Trends API)
*   **Endpoints (Mock):**
    *   `GET /api/market/products/search` -> Returns hardcoded "winning products".
    *   `GET /api/market/niche/analyze` -> Returns simulated competition scores.

## 3. Supplier Aggregator (Supplier Agent)
*Simulates: AliExpress, CJ Dropshipping, Alibaba*

*   **Interface:** `FulfilmentPort` (Partial overlap)
*   **Adapters:** `MockFulfilmentAdapter`, `LiveFulfilmentAdapter`
*   **Endpoints (Mock):**
    *   `GET /api/suppliers/search` -> Returns mock suppliers with varying shipping times.
    *   `POST /api/suppliers/negotiate` -> Simulates a negotiation chat bot.

## 4. E-Commerce Platform (Store Build Agent)
*Simulates: Shopify Admin API*

*   **Interface:** `ShopPlatformPort`
*   **Adapters:**
    *   `MockShopAdapter`: Updates local state, logs actions.
    *   `LiveShopAdapter`: Calls Shopify Admin REST API.
*   **Endpoints (Mock):**
    *   `createProduct(product)` -> Generates a mock product ID.
    *   `getOrders()` -> Returns simulated orders from the traffic engine.

## 5. Ad Network (Marketing Agent)
*Simulates: Meta Ads Manager, TikTok Ads API*

*   **Interface:** `AdsPlatformPort`
*   **Adapters:**
    *   `MockAdsAdapter`: Stores campaigns in memory/JSON.
    *   `LiveAdsAdapter`: Calls Meta Marketing API.
*   **Endpoints (Mock):**
    *   `createCampaign(campaign)` -> Returns a mock Campaign ID.
    *   `getCampaignStats(id)` -> Returns simulated impressions/clicks/conversions based on budget.

## 6. Traffic & Market Events (Simulation Engine)
*Simulates: Real User Traffic, External Market Forces*

*   **Engine:** `SimulationService`
*   **Logic:**
    *   `simulateTraffic()`: Calculates visitors based on active campaigns and budget.
    *   `generateMarketEvent()`: Randomly introduces external factors (Competitor Price War, Viral Trend).
    *   **Output:** Generates `Order` objects and `Event` logs that are persisted via the `PersistencePort`.

## 7. Helpdesk System (Customer Service Agent)
*Simulates: Zendesk, Gorgias, Intercom*

*   **Interface:** `EmailPort`
*   **Adapters:** `MockEmailAdapter`, `LiveEmailAdapter` (SMTP/Gmail)
*   **Endpoints (Mock):**
    *   `fetchEmails()` -> Returns mock customer complaints.
    *   `sendEmail(to, subject, body)` -> Logs the email to console/file.

## 8. Logistics Provider (Operations Agent)
*Simulates: ShipStation, 3PL Provider*

*   **Interface:** `FulfilmentPort`
*   **Adapters:** `MockFulfilmentAdapter`, `LiveFulfilmentAdapter`
*   **Endpoints (Mock):**
    *   `fulfillOrder(orderId)` -> Generates a mock tracking number.
*   **`GET /api/logistics/inventory/{sku}`**
    *   *Used by:* `check_inventory`
    *   *Response:* Current stock count and warehouse location.

## 8. BI / Data Warehouse (Analytics Agent)
*Simulates: Google Analytics, SQL Data Warehouse*

*   **`GET /api/analytics/reports/sales`**
    *   *Used by:* `generate_report`
    *   *Query Params:* `start_date`, `end_date`
    *   *Response:* JSON object with revenue, costs, profit, and conversion rate.
    *   *Real World Equivalent:* `Google Analytics 4 Data API`
*   **`POST /api/analytics/predict`**
    *   *Used by:* `predict_sales`
    *   *Body:* `{ "historical_data": [...], "horizon": "1 month" }`
    *   *Response:* Forecasted revenue and confidence interval.
    *   *Real World Equivalent:* **Custom Python/Pandas Script** (No direct API, usually internal logic).

