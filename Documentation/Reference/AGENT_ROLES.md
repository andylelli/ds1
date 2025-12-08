# 🤖 Agent Roles & Responsibilities

## 📖 Introduction
The DropShip AI (DS1) system operates as a **multi-agent swarm**, where specialized autonomous agents collaborate to build and manage a dropshipping business. Unlike a traditional monolithic script, each agent acts as a distinct "employee" with a specific persona, a limited set of responsibilities, and a unique toolkit.

This document serves as the definitive reference for each agent's role, defining what they do, what tools they can access, and how they interact with the rest of the system.

The system relies on two core architectural pillars:
1.  **Event Bus:** An asynchronous messaging backbone that allows agents to react to system changes (e.g., `ORDER_PAID`) without tight coupling.
2.  **Model Context Protocol (MCP):** A standardized interface that gives agents safe, structured access to external tools (Shopify, Meta Ads, Database) and local resources.

---

## 🧩 Agent Definition Template
*Use the following structure when defining or updating an agent's reference section.*

### 👤 [Agent Name]
**Role:** [The agent's persona, e.g., "The Strategist" or "The Builder"]
**Objective:** [A single sentence defining their primary measure of success]

#### 📋 Key Responsibilities
*   **[Responsibility 1]:** Description of the task.
*   **[Responsibility 2]:** Description of the task.

#### 🛠️ Tools & Capabilities
*   `tool.name()`: Description of what this tool allows the agent to do.
*   `tool.name()`: Description of what this tool allows the agent to do.

#### ⚡ Event Interactions
*   **Listens For:** `EVENT_NAME`, `EVENT_NAME`
*   **Emits:** `EVENT_NAME`, `EVENT_NAME`

---

### 👔 CEO Agent
**Role:** The Orchestrator & Strategic Lead
**Objective:** To oversee the entire business lifecycle, ensuring agents collaborate effectively to achieve profitability while managing risk.

#### 📋 Key Responsibilities
*   **Workflow Orchestration:** Triggers the core business workflows (Growth, Operations, Optimization) based on schedules or user commands. It ensures that hand-offs between agents (e.g., Research -> Sourcing) happen smoothly.
*   **Approval Gatekeeper:** Reviews product research data (margin, competition) and makes the final "Go/No-Go" decision before resources are committed. It acts as the final check against "hallucinated" opportunities.
*   **Crisis Management:** Acts as the escalation point for critical issues (e.g., angry customers, supplier failures, rapid budget drain) that require executive intervention or human alert.
*   **Reporting Interface:** Serves as the primary conversational interface for the human user. It synthesizes logs from all other agents into coherent status updates, translating technical logs into business insights.

#### 🛠️ Tools & Capabilities
*   `ceo.chat(message)`: Analyzes system-wide logs to answer human queries about business health.
*   `ceo.approve_product(productId)`: Authorizes the Store Builder and Marketing agents to proceed with a launch.
*   `ceo.reject_product(productId)`: Terminates a product candidate to prevent wasted ad spend.
*   `ceo.pause_simulation()`: Emergency stop mechanism that halts all agent activities.
*   `ceo.get_status_report()`: Compiles a high-level summary of active products, daily revenue, and pending alerts.

#### ⚡ Event Interactions
*   **Listens For:** `USER_COMMAND`, `RESEARCH_COMPLETED`, `ESCALATION_TRIGGERED`, `DAILY_REPORT_REQUESTED`
*   **Emits:** `WORKFLOW_STARTED`, `PRODUCT_APPROVED`, `PRODUCT_REJECTED`, `CAMPAIGN_PAUSED`, `REPORT_GENERATED`

---

### 📈 Analytics Agent
**Role:** The Financial Analyst & Data Scientist
**Objective:** To provide accurate, real-time financial visibility and actionable insights to drive profitability.

#### 📋 Key Responsibilities
*   **Data Aggregation:** Merges data from disparate sources (Meta Ads, Shopify, Bank) to create a "Single Source of Truth" for the business.
*   **Performance Monitoring:** continuously calculates critical metrics like ROAS (Return on Ad Spend), CPA (Cost Per Acquisition), and Net Profit.
*   **Optimization Triggers:** Identifies underperforming assets (ads, products) and signals the Marketing Agent to kill them, or identifies winners to scale.
*   **Forecasting:** Uses historical data to predict inventory needs and cash flow requirements.

#### 🛠️ Tools & Capabilities
*   `analytics.generate_report(period)`: Creates a P&L statement for a specific timeframe (Daily/Weekly).
*   `analytics.calculate_roas(spend, revenue)`: Computes the efficiency of ad spend.
*   `analytics.predict_sales(product)`: Forecasts future demand to aid in inventory planning.
*   `analytics.audit_data()`: Performs sanity checks to ensure ad platforms aren't reporting delayed or cached data.

#### ⚡ Event Interactions
*   **Listens For:** `OPTIMIZATION_TICK`, `ORDER_PAID`, `CAMPAIGN_LAUNCHED`
*   **Emits:** `DATA_READY`, `REPORT_GENERATED`, `ALERT_LOW_MARGIN`

---

### 📦 Operations Agent
**Role:** The Logistics Manager
**Objective:** To ensure every customer order is purchased from the supplier and delivered on time, minimizing errors and delays.

#### 📋 Key Responsibilities
*   **Order Fulfillment:** Detects paid orders in Shopify and instantly purchases the corresponding items from the supplier (AliExpress/CJ Dropshipping).
*   **Inventory Management:** Monitors stock levels at the supplier side to prevent selling out-of-stock items.
*   **Tracking Sync:** Retrieves tracking numbers from suppliers and updates the Shopify order status to notify customers.
*   **Exception Handling:** Manages shipping issues like lost packages or delayed shipments by triggering reshipments or refunds.

#### 🛠️ Tools & Capabilities
*   `ops.fulfill_order(order_id)`: Automates the purchase process with the supplier.
*   `ops.check_inventory(sku)`: Verifies stock availability before or after a sale.
*   `ops.handle_shipping_issue(order_id, issue_type)`: Resolves delivery exceptions (e.g., "Lost in Transit").
*   `ops.sync_tracking(order_id)`: Updates the customer-facing order status with real-time carrier data.

#### ⚡ Event Interactions
*   **Listens For:** `ORDER_PAID`, `SUPPLIER_SHIPPED`, `SHIPPING_DELAY_DETECTED`
*   **Emits:** `SUPPLIER_ORDER_PLACED`, `ORDER_FULFILLED`, `INVENTORY_LOW`

---

### 📢 Marketing Agent
**Role:** The Ad Manager & Copywriter
**Objective:** To acquire customers at the lowest possible cost (CPA) by creating, testing, and scaling ad campaigns.

#### 📋 Key Responsibilities
*   **Campaign Creation:** Launches new ad campaigns on Meta (Facebook/Instagram) and TikTok, setting budgets, targeting, and creative assets.
*   **Copywriting:** Generates persuasive ad copy and headlines tailored to specific customer personas.
*   **Bid Management:** Adjusts daily budgets based on performance signals from the Analytics Agent (e.g., cutting spend on low-ROAS ads).
*   **Creative Testing:** Rotates different image/video assets to find high-performing combinations.

#### 🛠️ Tools & Capabilities
*   `marketing.create_ad_campaign(platform, budget, product)`: Initializes a new campaign structure.
*   `marketing.write_copy(product, angle)`: Generates text for ads (e.g., "Fear of Missing Out" angle vs. "Benefit-Driven").
*   `marketing.update_budget(campaign_id, new_amount)`: Scales spend up or down.
*   `marketing.pause_ad(ad_id)`: Stops spending on a specific ad creative.

#### ⚡ Event Interactions
*   **Listens For:** `PRODUCT_APPROVED`, `ALERT_LOW_MARGIN`, `BUDGET_INCREASED`
*   **Emits:** `CAMPAIGN_LAUNCHED`, `AD_PAUSED`, `CREATIVE_REQUESTED`

---

### 🕵️ Product Research Agent
**Role:** The Trend Hunter
**Objective:** To identify high-potential products with strong market demand and low competition before they become saturated.

#### 📋 Key Responsibilities
*   **Trend Analysis:** Scans social media (TikTok, Instagram Reels) and marketplaces (Amazon Movers & Shakers) to spot rising consumer interests.
*   **Competitor Intelligence:** Analyzes existing stores selling similar products to determine their pricing, ad angles, and weaknesses.
*   **Niche Validation:** Uses data (search volume, engagement rates) to score a niche's viability.
*   **Selection:** Filters thousands of potential items down to a shortlist of "Winners" for the CEO to review.

#### 🛠️ Tools & Capabilities
*   `research.find_winning_products(category)`: Returns a list of trending items based on current algorithms.
*   `research.analyze_niche(niche)`: Provides a "Saturation Score" and "Demand Score" for a specific market segment.
*   `research.analyze_competitors(product_name)`: Returns a list of rival stores and their estimated monthly revenue.
*   `research.get_google_trends(keyword)`: Checks search volume history to avoid seasonal fads.

#### ⚡ Event Interactions
*   **Listens For:** `WORKFLOW_STARTED`, `CREATIVE_REQUESTED` (for new angles)
*   **Emits:** `RESEARCH_COMPLETED`, `TREND_DETECTED`

---
