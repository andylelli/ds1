# Simulated 3rd Party Endpoints

This document lists the API endpoints required to simulate the external ecosystem for Project DS1.

> **Note:** As of Dec 4, 2025, the system uses a **Hybrid Architecture**.
> *   **Mock Mode:** Agents call internal helper methods (e.g., `_findSuppliersMock`) that return hardcoded data matching these schemas.
> *   **Live Mode:** Agents call the real external APIs listed below.
> *   **Switching:** Controlled by `config.useSimulatedEndpoints`.

## 1. Marketplace Data Provider (Product Research Agent)
*Simulates: Amazon API, JungleScout, Google Trends*

*   **`GET /api/market/products/search`**
    *   *Used by:* `find_winning_products`
    *   *Query Params:* `category`, `min_price`, `max_price`, `criteria`
    *   *Response:* List of products with sales rank and estimated revenue.
    *   *Real World Equivalent:* `rapidapi.com/amazon-data-scraper`
*   **`GET /api/market/niche/analyze`**
    *   *Used by:* `analyze_niche`
    *   *Query Params:* `keyword`
    *   *Response:* Competition score, search volume, saturation level.
    *   *Real World Equivalent:* `google-trends-api`

## 2. Supplier Aggregator (Supplier Agent)
*Simulates: AliExpress, CJ Dropshipping, Alibaba*

*   **`GET /api/suppliers/search`**
    *   *Used by:* `find_suppliers`
    *   *Query Params:* `product_id` (or keywords)
    *   *Response:* List of suppliers with ratings, shipping times, and unit costs.
    *   *Real World Equivalent:* `AliExpress Open Platform API`
*   **`POST /api/suppliers/negotiate`**
    *   *Used by:* `negotiate_price`
    *   *Body:* `{ "supplier_id": "...", "target_price": 15.00, "quantity": 100 }`
    *   *Response:* Success/Fail, counter-offer price.
    *   *Real World Equivalent:* **WhatsApp Web Automation** (No public API exists for negotiation).

## 3. E-Commerce Platform (Store Build Agent)
*Simulates: Shopify Admin API*

*   **`POST /admin/api/products.json`**
    *   *Used by:* `create_product_page`
    *   *Body:* Standard Shopify Product Object (title, body_html, variants, images).
    *   *Response:* Created product ID and public URL.
    *   *Real World Equivalent:* `Shopify Admin REST API`
*   **`PUT /admin/api/products/{id}.json`**
    *   *Used by:* `optimize_seo`
    *   *Body:* `{ "product": { "metafields": [...] } }`
    *   *Response:* Updated product details.

## 4. Ad Network (Marketing Agent)
*Simulates: Meta Ads Manager, TikTok Ads API*

*   **`POST /api/ads/campaigns`**
    *   *Used by:* `create_ad_campaign`
    *   *Body:* `{ "name": "...", "objective": "CONVERSIONS", "budget": 50.00 }`
    *   *Response:* Campaign ID and status (e.g., "IN_REVIEW").
    *   *Real World Equivalent:* `Meta Marketing API` / `TikTok Ads API`
*   **`POST /api/ads/creatives`**
    *   *Used by:* `write_copy` (indirectly, when deploying ads)
    *   *Body:* `{ "title": "...", "body": "...", "image_url": "..." }`
    *   *Response:* Creative ID.

## 5. Traffic & Market Events (Simulation Engine)
*Simulates: Real User Traffic, External Market Forces*

*   **`INTERNAL: simulateTraffic()`**
    *   *Input:* `activeCampaigns`, `marketEvent`
    *   *Logic:* Calculates visitors based on Budget / CPC. Applies modifiers from Market Events.
    *   *Output:* Stream of `Visitor` objects and `Order` events.
    *   *Real World Equivalent:* **Google Analytics / Shopify Analytics** (Passive observation of user behavior).
*   **`INTERNAL: getMarketEvent()`**
    *   *Logic:* Randomly selects events like "Competitor Price War" or "Viral Trend".
    *   *Output:* Event object with `impact` modifiers (Traffic, CR, CPC).
    *   *Real World Equivalent:* **N/A** (These are environmental factors, though some can be detected via **Google Trends** or **Competitor Price Scrapers**).

## 6. Helpdesk System (Customer Service Agent)
*Simulates: Zendesk, Gorgias, Intercom*

*   **`GET /api/tickets/{id}`**
    *   *Used by:* `handle_ticket` (to fetch context)
    *   *Response:* Customer message history and sentiment metadata.
    *   *Real World Equivalent:* `Zendesk Support API` / `Gorgias API`
*   **`POST /api/tickets/{id}/reply`**
    *   *Used by:* `handle_ticket`
    *   *Body:* `{ "message": "Sorry about that...", "status": "solved" }`
    *   *Response:* Confirmation.
*   **`GET /api/tickets/search`**
    *   *Used by:* `generate_faq`
    *   *Query Params:* `query` (e.g., "shipping", "refunds")
    *   *Response:* List of past tickets matching the topic.

## 7. Logistics Provider (Operations Agent)
*Simulates: ShipStation, 3PL Provider*

*   **`POST /api/logistics/orders/fulfill`**
    *   *Used by:* `fulfill_order`
    *   *Body:* `{ "order_id": "...", "address": "..." }`
    *   *Response:* Tracking number and carrier info.
    *   *Real World Equivalent:* `AfterShip API` or `AliExpress Dropshipping API`
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

