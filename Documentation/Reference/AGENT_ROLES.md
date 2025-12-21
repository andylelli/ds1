# 🤖 Agent Roles & Responsibilities

## 📖 Introduction
The DropShip AI (DS1) system operates as a **multi-agent swarm**, where specialized autonomous agents collaborate to build and manage a dropshipping business. Unlike a traditional monolithic script, each agent acts as a distinct "employee" with a specific persona, a limited set of responsibilities, and a unique toolkit.

This document serves as the definitive reference for each agent's role, defining what they do, what tools they can access, and how they interact with the rest of the system.

The system relies on three core architectural pillars:
1.  **Event Bus:** An asynchronous messaging backbone that allows agents to react to system changes (e.g., `ORDER_PAID`) without tight coupling.
2.  **Model Context Protocol (MCP):** A standardized interface that gives agents safe, structured access to external tools (Shopify, Meta Ads, Database) and local resources.
3.  **OpenAI (LLM):** The cognitive engine powering the agents' decision-making, copywriting, and data synthesis capabilities.

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
*   `tool_name`: Description of what this tool allows the agent to do.

#### ⚡ Event Interactions
*   **Listens For:** `EVENT_NAME`
*   **Emits:** `EVENT_NAME`

---

### 👔 CEO Agent
**Role:** The Orchestrator & Strategic Lead
**Objective:** To oversee the entire business lifecycle, ensuring agents collaborate effectively to achieve profitability while managing risk.

#### 📋 Key Responsibilities
*   **Workflow Orchestration:** Triggers the core business workflows (Growth, Operations, Optimization) based on schedules or user commands.
*   **Approval Gatekeeper:** Reviews product research data and makes the final "Go/No-Go" decision.
*   **Crisis Management:** Acts as the escalation point for critical issues.
*   **Reporting Interface:** Serves as the primary conversational interface for the human user.

#### 🛠️ Tools & Capabilities
*   `startProductResearch`: Instructs the Research Agent to find winning products in a specific category.
*   `sourceProduct`: Instructs the Supplier Agent to find suppliers for a specific product.
*   `buildStorePage`: Instructs the Store Agent to create a product page.
*   `launchMarketingCampaign`: Instructs the Marketing Agent to launch an ad campaign.
*   `approveProduct` / `rejectProduct`: Approves or rejects a product candidate.
*   `approveSupplier` / `rejectSupplier`: Approves or rejects a supplier candidate.

#### ⚡ Event Interactions
*   **Listens For:** `System.Error`, `Sales.OrderReceived`, `OpportunityResearch.BriefsPublished`
*   **Emits:** `Product.Approved`, `Supplier.Approved`

---

### 📈 Analytics Agent
**Role:** The Financial Analyst & Data Scientist
**Objective:** To provide accurate, real-time financial visibility and actionable insights to drive profitability.

#### 📋 Key Responsibilities
*   **Data Aggregation:** Merges data from disparate sources to create a "Single Source of Truth".
*   **Performance Monitoring:** Calculates critical metrics like ROAS and Net Profit.
*   **Forecasting:** Uses historical data to predict inventory needs.

#### 🛠️ Tools & Capabilities
*   `generate_report`: Creates a P&L statement for a specific timeframe (Daily/Weekly).
*   `predict_sales`: Forecasts future demand to aid in inventory planning.

#### ⚡ Event Interactions
*   **Listens For:** `OPTIMIZATION_TICK`, `ORDER_PAID`, `CAMPAIGN_LAUNCHED`
*   **Emits:** `DATA_READY`, `REPORT_GENERATED`

---

### 📦 Operations Agent
**Role:** The Logistics Manager
**Objective:** To ensure every customer order is purchased from the supplier and delivered on time.

#### 📋 Key Responsibilities
*   **Order Fulfillment:** Detects paid orders in Shopify and purchases items from the supplier.
*   **Inventory Management:** Monitors stock levels.
*   **Exception Handling:** Manages shipping issues like lost packages.

#### 🛠️ Tools & Capabilities
*   `fulfill_order`: Automates the purchase process with the supplier.
*   `check_inventory`: Verifies stock availability.
*   `handle_shipping_issue`: Resolves delivery exceptions.

#### ⚡ Event Interactions
*   **Listens For:** `ORDER_PAID`, `SUPPLIER_SHIPPED`
*   **Emits:** `Sales.OrderShipped`

---

### 🔬 Product Research Agent
**Role:** The Trend Hunter
**Objective:** To identify high-potential products with healthy margins and low competition, and produce detailed Opportunity Briefs.

#### 📋 Key Responsibilities
*   **Trend Analysis:** Scans Google Trends and social media for rising interests.
*   **Keyword Validation:** Uses Google Ads data (Search Volume, CPC) to validate demand.
*   **Competitor Analysis:** Evaluates existing sellers to find gaps in the market.
*   **Brief Generation:** Synthesizes data into comprehensive Opportunity Briefs for the CEO.

#### 🛠️ Tools & Capabilities
*   `find_winning_products`: Searches for trending products.
*   `analyze_niche`: Evaluates a specific market category.
*   `analyze_competitors`: Checks competition levels.

---

### 🏭 Supplier Agent
**Role:** The Sourcing Specialist
**Objective:** To find reliable suppliers with the best prices and shipping times.

#### 📋 Key Responsibilities
*   **Sourcing:** Finds suppliers on AliExpress/CJ Dropshipping.
*   **Negotiation:** Tries to get better unit costs.
*   **Stock Management:** Orders inventory to a warehouse (if applicable).

#### 🛠️ Tools & Capabilities
*   `find_suppliers`: Searches for suppliers for a given product.
*   `negotiate_price`: Attempts to lower the cost per unit.
*   `order_stock`: Places a bulk order.

---

### 🏗️ Store Build Agent
**Role:** The Web Developer & CRO Specialist
**Objective:** To create high-converting product pages on Shopify.

#### 📋 Key Responsibilities
*   **Page Creation:** Builds product pages with images, descriptions, and pricing.
*   **SEO Optimization:** Optimizes titles and meta tags for search engines.

#### 🛠️ Tools & Capabilities
*   `create_product_page`: Generates a new product page on Shopify.
*   `optimize_seo`: Updates page metadata for better ranking.

---

### 📣 Marketing Agent
**Role:** The Media Buyer & Copywriter
**Objective:** To drive qualified traffic to the store at the lowest possible cost.

#### 📋 Key Responsibilities
*   **Campaign Management:** Launches and manages Google Search campaigns (via `LiveAdsAdapter`).
*   **Copywriting:** Writes ad copy and creative descriptions.

#### 🛠️ Tools & Capabilities
*   `create_ad_campaign`: Launches a new Google Ads campaign.
*   `stop_campaign`: Pauses an underperforming campaign.
*   `write_copy`: Generates marketing text.

---

### 🎧 Customer Service Agent
**Role:** The Support Representative
**Objective:** To keep customers happy and resolve issues quickly.

#### 📋 Key Responsibilities
*   **Ticket Resolution:** Answers customer emails and support tickets.
*   **FAQ Management:** Updates the FAQ based on common questions.

#### 🛠️ Tools & Capabilities
*   `handle_ticket`: Responds to a customer inquiry.
*   `generate_faq`: Creates new FAQ entries.
*   `check_emails`: Scans inbox for new messages.
