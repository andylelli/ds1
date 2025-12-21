# 📖 User Stories & Technical Scenarios

This document brings the **Agentic AI Dropshipping Platform** to life. It maps real-world business challenges to the specific code paths, agents, and AI logic that solve them.

---

## 🎭 The Cast (Agents)

| Agent | Role | Key File | Primary Responsibility |
|-------|------|----------|------------------------|
| **CEO** | Orchestrator | `src/agents/CEOAgent.ts` | Strategy, planning, and answering user questions about state. |
| **Product Researcher** | Scout | `src/agents/ProductResearchAgent.ts` | Finding winning products and analyzing niches. |
| **Supplier** | Sourcing | `src/agents/SupplierAgent.ts` | Finding vendors and negotiating prices. |
| **Store Builder** | Developer | `src/agents/StoreBuildAgent.ts` | Creating products and pages in Shopify. |
| **Marketing** | CMO | `src/agents/MarketingAgent.ts` | Writing ad copy and planning campaigns. |
| **Customer Service** | Support | `src/agents/CustomerServiceAgent.ts` | Answering customer inquiries. |
| **Operations** | Logistics | `src/agents/OperationsAgent.ts` | Fulfilling orders and tracking inventory. |
| **Analytics** | Data | `src/agents/AnalyticsAgent.ts` | Reporting on sales and performance. |

---

## 🎬 Scenario 1: The Inception (Planning)

**The User's Dream:**
> "I have $5,000 and I want to start a brand selling eco-friendly yoga gear. I don't know where to start."

**The System's Response:**
The user sends a command via the UI or API: `POST /api/research { "category": "Yoga" }`.

**Under the Hood:**
1.  **The Brain Activates**: `src/index.ts` receives the request and publishes an event to the **Event Bus**.
2.  **Strategic Reasoning**: The **CEO Agent** observes the system state. It uses GPT-4 (`src/infra/ai/OpenAIService.ts`) to generate a strategy.
3.  **Delegation**: The CEO publishes a `Research.Requested` event.
4.  **Memory**: This entire plan is saved to **PostgreSQL** via `src/infra/db/PostgresAdapter.ts`, so the CEO never forgets the mission.

---

## 🎬 Scenario 2: The Hunt (Product Research)

**The Challenge:**
> "I need a product that isn't saturated. Everyone sells yoga mats. Find me something unique."

**The System's Response:**
The **Product Research Agent** picks up the `Research.Requested` event.

**Under the Hood:**
1.  **Deep Dive**: The agent executes its tool `find_winning_products`.
2.  **Data Synthesis**: It scans Google Trends (via `src/infra/trends/GoogleTrendsAPI/LiveTrendAdapter.ts`) and competitor data. It spots a trend: "Alignment Lines."
3.  **The Eureka Moment**: It generates a structured JSON object:
    ```json
    {
      "product": "Smart Alignment Yoga Mat",
      "reason": "Solves the problem of poor posture. High viral potential.",
      "target_price": "$60"
    }
    ```
4.  **Logging**: "Found potential winner: Smart Alignment Mat" is logged to the database.

---

## 🎬 Scenario 3: Building the Store (Shopify Integration)

**The Challenge:**
> "I have the product, but I hate coding. I need a beautiful product page that converts visitors into buyers."

**The System's Response:**
The CEO approves the product, triggering a `Product.Approved` event. The **Store Build Agent** listens for this.

**Under the Hood:**
1.  **Creative Writing**: The agent calls OpenAI to write persuasive copy: *"Perfect your downward dog with our patented alignment system."*
2.  **API Magic**: It uses the **Shopify Adapter** (`src/infra/shop/ShopifyAPI/ShopifyAdapter.ts`) to:
    *   Upload images.
    *   Set the price to $59.99.
    *   Publish the product to the "Online Store" channel.
3.  **Result**: It returns a live URL: `https://mystore.com/products/smart-alignment-mat`.

---

## 🎬 Scenario 4: The "All-Hands" Meeting (Chat with CEO)

**The User's Question:**
> "I've been away for 3 days. What exactly has the team accomplished?"

**The System's Response:**
The user asks the CEO: `POST /api/ceo/chat { "message": "Status report, please." }`.

**Under the Hood:**
1.  **Context Retrieval**: The CEO executes `getRecentLogs(50)` in `src/infra/db/PostgresAdapter.ts`. It pulls the raw event stream from the database:
    *   *Event 101: Researcher found Smart Mat.*
    *   *Event 102: Supplier negotiated price to $12.*
    *   *Event 103: Store Builder published page.*
2.  **Narrative Generation**: The CEO feeds these logs into GPT-4 with the prompt: *"Summarize these logs for the Chairman."*
3.  **The Answer**: *"Welcome back. We have been busy. We identified the Smart Alignment Mat as a winner, secured a supplier at $12/unit (giving us a 80% margin), and the product page is now live. Shall we start ads?"*

---

## 🎬 Scenario 5: Marketing Campaign (The Launch)

**The Challenge:**
> "The store is live. Now bring me customers."

**The System's Response:**
The user (or CEO) triggers the **Marketing Agent**.

**Under the Hood:**
1.  **Strategy**: The agent decides to launch a Facebook Ad Campaign.
2.  **Execution**: It calls `create_ad_campaign` via `src/infra/ads/GoogleAdsAPI/LiveAdsAdapter.ts` (or Meta adapter).
3.  **Optimization**: It monitors the `ROAS` (Return on Ad Spend). If it drops below 2.0, it kills the ad automatically.
