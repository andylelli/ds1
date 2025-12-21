# 📝 Things To Do: External Integrations Roadmap

> **Current Status**: 🟢 **Mock Mode Complete**. The system currently runs in a fully simulated environment.
> **Next Phase**: 🔴 **Live Mode**. The following integrations are required to connect the agents to the real world.

This document outlines the external services, APIs, and websites that need to be integrated for each agent to reach full autonomy. It includes the **Business Justification (Why)** and the **Implementation Steps (How)** for each task.

---

## 🛡️ Infrastructure & Core

### 1. Event-Driven Architecture (Critical for Live Mode)
- [x] **Implement Event Bus (Redis/EventEmitter)**
    - **Why**: Real business is asynchronous. Webhooks (e.g., `orders/create`) must trigger agents immediately, not wait for a loop.
    - **How**:
        1.  Install `redis` or use Node's `EventEmitter` for local dev.
        2.  Create `src/lib/eventBus.js`.
        3.  Refactor `simulation.js` to emit events (`EVENT_TICK`, `EVENT_ORDER_PAID`) instead of running a linear script.
        4.  Update Agents to subscribe to relevant events.

### 2. Database Persistence Layer
- [x] **Implement Persistence Port & Adapters**
    - **Why**: Decouple the application from the specific database implementation (Hexagonal Architecture).
    - **How**:
        1.  Create `PersistencePort` interface.
        2.  Implement `PostgresAdapter` for live data.
        3.  Implement `MockAdapter` for simulation.
- [ ] **Database Schema Management / Migrations**
    - **Why**: We need a reliable way to create tables and apply schema changes in the Live Postgres DB.
    - **How**:
        1.  Use a tool like `knex` or `db-migrate`.
        2.  Create migration scripts for `products`, `orders`, `events`, `ads`.
        3.  Add a startup check to ensure DB schema is up to date.

## Change Log
| Date | Author | Change Description |
| :--- | :--- | :--- |
| 2025-12-21 | GitHub Copilot | Standardized format per PMO Maintenance Plan. Marked Event Bus as Complete. |

### 3. Security & Compliance
- [ ] **Implement PII Redaction**
    - **Why**: Logging real customer names/addresses violates GDPR/CCPA.
    - **How**:
        1.  Create a logger middleware that regex-replaces emails and phone numbers with `***`.
- [ ] **Token Management System**
    - **Why**: OAuth tokens for Shopify/Meta expire. Hardcoded keys will fail after 24h.
    - **How**:
        1.  Create a `TokenManager` class that checks expiry.
        2.  Implement the "Refresh Token" flow to get new access tokens automatically.

---

## 🕵️ Product Research Agent

### 1. Marketplaces (Amazon / AliExpress / Temu)
- [ ] **Integrate Amazon Best Sellers & AliExpress Data**
    - **Why**: To validate that people are actually buying a product before we try to sell it. We need to see sales volume, rating distribution, and price points.
    - **How**:
        1.  Sign up for a scraping API like **RapidAPI** (e.g., "Amazon Data Scraper" or "AliExpress Data").
        2.  Update `src/agents/productResearchAgent.js` to call this API instead of mocking data.
        3.  Implement logic to filter results: `Review Count > 50`, `Rating > 4.5`, `Price > $20`.

### 2. Trend Analysis (Google Trends / TikTok)
- [ ] **Integrate Google Trends & TikTok Creative Center**
    - **Why**: To catch "viral waves" early. Selling a product on the uptrend is 10x easier than selling a stale one.
    - **How**:
        1.  Use the `google-trends-api` npm package (unofficial) or a paid SERP API.
        2.  For TikTok, use a scraper or the official **TikTok Research API** (requires approval) to find trending hashtags.
        3.  Create a function `checkTrend(keyword)` that returns a score (0-100).

### 3. Competitor Intelligence (FB Ad Library)
- [ ] **Integrate Facebook Ad Library**
    - **Why**: To see exactly what ads competitors are running. If an ad has been running for >1 month, it is likely profitable.
    - **How**:
        1.  Register as a developer on **Meta for Developers**.
        2.  Get an Access Token for the **Marketing API**.
        3.  Use the `Ad Library API` endpoint to search for ads by keyword (e.g., "posture corrector").

---

## 📦 Supplier Agent

### 1. Sourcing Platforms (AliExpress / CJ Dropshipping)
- [ ] **Integrate AliExpress / CJ Dropshipping APIs**
    - **Why**: To automate order placement. Manually typing addresses into AliExpress is unscalable and prone to error.
    - **How**:
        1.  Apply for the **AliExpress Open Platform** or **CJ Dropshipping API**.
        2.  Get `App Key` and `Secret`.
        3.  Create a tool `place_order(customer_details, product_id)` in `supplierAgent.js`.

### 2. Communication (WhatsApp / WeChat)
- [ ] **Integrate WhatsApp Web Automation**
    - **Why**: The best prices are negotiated via direct chat, not clicked on a website. Agents need to "talk" to suppliers.
    - **How**:
        1.  Use a library like `whatsapp-web.js` (runs a headless browser).
        2.  Create a tool `send_message_to_supplier(phone, text)`.
        3.  Train the agent to ask specific questions: "What is the MOQ?" "Can you do faster shipping?"

---

## 🏗️ Store Build Agent

### 1. E-commerce (Shopify Theme API)
- [ ] **Integrate Shopify Theme API**
    - **Why**: To customize the look of the store programmatically (e.g., changing colors to match the product niche).
    - **How**:
        1.  Update the Shopify App scopes to include `write_themes`.
        2.  Use the Asset API to upload new `.liquid` files or update `settings_data.json`.

### 2. Assets (Unsplash / TinyPNG)
- [ ] **Integrate Unsplash & TinyPNG**
    - **Why**: High-quality, fast-loading images increase conversion rates. We need free stock photos and compressed assets.
    - **How**:
        1.  Get an API key from **Unsplash** and **TinyPNG**.
        2.  Create a helper `fetchAndCompressImage(keyword)`.
        3.  Use this when generating blog posts or collection banners.

### 3. SEO (Google Search Console)
- [ ] **Integrate Google Search Console API**
    - **Why**: To monitor organic traffic and indexing issues. Free traffic is the highest ROI traffic.
    - **How**:
        1.  Set up a Service Account in **Google Cloud Console**.
        2.  Enable the Search Console API.
        3.  Create a tool `submit_sitemap()` to ping Google whenever we add new products.

---

## 🎧 Customer Service & Ticketing Upgrade

### 1. Context-Aware Ticketing System
*See `Documentation/Blueprints/DESIGN_CS_CONTEXT.md` for blueprint.*
- [ ] **Design Ticket Database Schema**
    - **Why**: Current tickets are ephemeral. We need to store conversation history, status, and priority to provide "human-like" continuity.
    - **How**:
        1.  Create `Tickets` collection: `{ id, customerId, orderId, status, priority, tags }`.
        2.  Create `Messages` collection: `{ id, ticketId, sender, content, timestamp }`.
- [ ] **Implement Ticket Manager Class**
    - **Why**: Centralized logic for CRUD operations on tickets.
    - **How**:
        1.  Create `src/lib/ticketManager.js`.
        2.  Implement `createTicket`, `addMessage`, `getHistory`, `updateStatus`.
- [ ] **Update Customer Service Agent**
    - **Why**: The agent must read the history *before* generating a reply.
    - **How**:
        1.  Update `handleTicket` tool to accept `ticket_id`.
        2.  Call `TicketManager.getHistory(ticket_id)` to build the prompt context.
        3.  Save the agent's response back to the DB.

### 2. Escalation & Priority Logic
- [ ] **Implement Sentiment-Based Escalation**
    - **Why**: Angry customers need faster, higher-quality responses to prevent chargebacks.
    - **How**:
        1.  Use OpenAI to score sentiment (0-100).
        2.  If sentiment < 20 (Very Angry), set `priority = 'critical'` and `status = 'escalated'`.
        3.  Escalated tickets trigger a notification to the `CEOAgent` (or human admin).

---

## 🏗️ Core Architecture Upgrades

### 1. Event-Driven Architecture (EDA)
*See `Documentation/Blueprints/DESIGN_EVENT_BUS.md` for blueprint.*
- [ ] **Implement Event Bus**
    - **Why**: Decouple agents from the synchronous simulation loop.
    - **How**: Create `src/lib/eventBus.js` (Node EventEmitter).
- [ ] **Refactor Operations Agent**
    - **Why**: Order fulfillment should happen immediately upon payment.
    - **How**: Subscribe `OperationsAgent` to `ORDER_PAID` event.

### 2. Multi-Product Support
*See `Documentation/Blueprints/DESIGN_MULTI_PRODUCT.md` for blueprint.*
- [ ] **Update Database Schema**
    - **Why**: Support multiple products with different lifecycles.
    - **How**: Change `db.product` (object) to `db.products` (array).
- [ ] **Refactor Marketing Agent**
    - **Why**: Ads need to target specific products.
    - **How**: Update tools to accept `productId`.

### 3. Retention System
*See `Documentation/Blueprints/DESIGN_RETENTION_SYSTEM.md` for blueprint.*
- [ ] **Create Retention Agent**
    - **Why**: Increase LTV via email flows.
    - **How**: Scaffold `src/agents/retentionAgent.js`.
- [ ] **Implement Abandoned Cart Flow**
    - **Why**: Recover lost sales.
    - **How**: Listen for `CHECKOUT_STARTED` -> Wait 1h -> Send Email.

### 4. Strategy & Intelligence
*See `Documentation/Blueprints/DESIGN_STRATEGY_ENGINE.md` for blueprint.*
- [ ] **Implement Strategy Engine**
    - **Why**: CEO needs to make data-driven decisions (Pivot vs Scale).
    - **How**: Create `src/lib/strategyEngine.js` with OODA loop logic.

### 5. Compliance & Risk
*See `Documentation/Blueprints/DESIGN_COMPLIANCE_SYSTEM.md` for blueprint.*
- [ ] **Create Compliance Guard**
    - **Why**: Prevent bans and lawsuits.
    - **How**: Create `src/lib/complianceGuard.js` with keyword blacklists.

### 6. Financial Analytics
*See `Documentation/Blueprints/DESIGN_ANALYTICS_PIPELINE.md` for blueprint.*
- [ ] **Implement Financial Ledger**
    - **Why**: Accurate P&L tracking including fees and COGS.
    - **How**: Create `src/lib/ledger.js` for transaction-level logging.

---

## 📢 Marketing Agent

### 1. Ad Platforms (Meta / TikTok / Google / Pinterest)
- [ ] **Integrate Meta Marketing API**
    - **Why**: To programmatically create, launch, and stop ads. This is the engine of the business.
    - **How**:
        1.  Create a **Meta Business Manager** account.
        2.  Generate a System User Access Token.
        3.  Implement `create_campaign`, `create_ad_set`, and `create_ad` tools.
        4.  **Crucial**: Implement a "Kill Switch" to stop ads if ROAS < 1.5.

- [ ] **Integrate Google Ads API**
    - **Why**: To capture high-intent search traffic (e.g., people searching "buy posture corrector").
    - **How**:
        1.  Apply for a Google Ads Developer Token (Basic Access).
        2.  Use the `google-ads-api` library.
        3.  Create tools to manage Search and Shopping campaigns.

- [ ] **Integrate Pinterest Ads API**
    - **Why**: High conversion rates for visual niches (Home Decor, DIY, Fashion).
    - **How**:
        1.  Register an app on Pinterest Developers.
        2.  Implement conversion tracking (Pixel) and ad creation tools.

### 2. Email (Klaviyo)
- [ ] **Integrate Klaviyo API**
    - **Why**: Email marketing accounts for 20-30% of revenue in mature stores. It recovers lost sales (abandoned carts).
    - **How**:
        1.  Get a Private API Key from Klaviyo.
        2.  Create a tool `create_flow(trigger, email_content)`.
        3.  Set up a "Welcome Series" flow automatically when the store launches.

---

## 🤝 Customer Service Agent

### 1. Ticketing (Zendesk / Gorgias)
- [ ] **Integrate Gorgias API**
    - **Why**: Gorgias is built for Shopify. It allows the agent to see order details next to the ticket.
    - **How**:
        1.  Sign up for a Gorgias dev account.
        2.  Use the API to fetch tickets and post replies.
        3.  Connect it to the `CustomerServiceAgent` to draft replies automatically.

### 2. Direct Messaging (Gmail / SMTP)
- [ ] **Integrate Nodemailer (SMTP)**
    - **Why**: To send transactional emails or direct replies if not using a helpdesk.
    - **How**:
        1.  Install `nodemailer`.
        2.  Configure it with a transactional email provider (SendGrid, Mailgun) or Google Workspace SMTP.
        3.  Create `send_email(to, subject, body)`.

---

## 🚚 Operations Agent

### 1. Logistics (17Track / AfterShip)
- [ ] **Integrate 17Track or AfterShip API**
    - **Why**: To proactively tell customers where their package is *before* they ask. Reduces support tickets by 50%.
    - **How**:
        1.  Get an API key from 17Track or AfterShip.
        2.  Create a cron job (scheduled task) that checks status of all "In Transit" orders every 6 hours.
        3.  If status changes to "Exception" or "Delivered", trigger an email.

### 2. Payments (Stripe / PayPal)
- [ ] **Integrate Stripe & PayPal APIs**
    - **Why**: To handle disputes (chargebacks) automatically and manage refunds.
    - **How**:
        1.  Use the `stripe` npm package and PayPal REST SDK.
        2.  Listen for webhooks `charge.dispute.created`.
        3.  Auto-submit evidence (tracking number, delivery proof) using the API.

### 3. Compliance (TaxJar)
- [ ] **Integrate TaxJar API**
    - **Why**: To automatically calculate and file sales tax in different jurisdictions.
    - **How**:
        1.  Connect TaxJar to the Shopify store.
        2.  Use the API to fetch tax reports for the Analytics Agent.

---

## 📊 Analytics Agent

### 2. Data Sources (GA4 / Pixel)
- [ ] **Integrate Google Analytics Data API (GA4)**
    - **Why**: To get the "truth" about traffic sources. Shopify data and Facebook data often disagree.
    - **How**:
        1.  Enable GA4 Data API in Google Cloud.
        2.  Create a tool `get_traffic_report(date_range)`.
        3.  Use this to calculate the real Conversion Rate per channel.

---

## 🖥️ Frontend & Visualization

### 1. Admin Panel Features
- [x] **Database Inspector**
    - **Why**: To verify data integrity and debug issues between Simulator and Live modes.
    - **How**:
        1.  Create `Database Inspector` tab in `admin.html`.
        2.  Implement backend API to filter by `source` (Live/Sim).
- [ ] **Implement CEO Chat Interface**
    - **Why**: To allow the human user to query the CEO Agent directly for status updates, strategy explanations, or to give high-level directives.
    - **How**:
        1.  Create `src/agents/ceoAgent.js` `handleChat(message)` method.
        2.  Create API endpoint `POST /api/chat/ceo`.
        3.  Update `admin.html` with a chat widget (bottom right or dedicated tab).

## Change Log
| Date | Author | Change Description |
| :--- | :--- | :--- |
| 2025-12-21 | GitHub Copilot | Standardized format per PMO Maintenance Plan. |
