# 📖 User Stories & Technical Scenarios

This document brings the **Agentic AI Dropshipping Platform** to life. It maps real-world business challenges to the specific code paths, agents, and AI logic that solve them.

---

## 🎭 The Cast (Agents)

| Agent | Role | Key File | Primary Responsibility |
|-------|------|----------|------------------------|
| **CEO** | Orchestrator | `src/agents/ceoAgent.js` | Strategy, planning, and answering user questions about state. |
| **Product Researcher** | Scout | `src/agents/productResearchAgent.js` | Finding winning products and analyzing niches. |
| **Supplier** | Sourcing | `src/agents/supplierAgent.js` | Finding vendors and negotiating prices. |
| **Store Builder** | Developer | `src/agents/storeBuildAgent.js` | Creating products and pages in Shopify. |
| **Marketing** | CMO | `src/agents/marketingAgent.js` | Writing ad copy and planning campaigns. |
| **Customer Service** | Support | `src/agents/customerServiceAgent.js` | Answering customer inquiries. |
| **Operations** | Logistics | `src/agents/operationsAgent.js` | Fulfilling orders and tracking inventory. |
| **Analytics** | Data | `src/agents/analyticsAgent.js` | Reporting on sales and performance. |

---

## 🎬 Scenario 1: The Inception (Planning)

**The User's Dream:**
> "I have $5,000 and I want to start a brand selling eco-friendly yoga gear. I don't know where to start."

**The System's Response:**
The user sends a simple command: `POST /api/agent/ceo/plan { "goal": "Start a yoga mat business" }`.

**Under the Hood:**
1.  **The Brain Activates**: `src/index.js` wakes up the **CEO Agent**.
2.  **Strategic Reasoning**: The CEO doesn't just Google "how to start a business." It uses GPT-4 (`src/lib/ai.js`) to generate a bespoke strategy. It decides: *"We need to validate demand first, then secure a supplier, then build the store."*
3.  **Delegation**: The CEO creates a JSON task list. It assigns the **Researcher** to find "high-margin cork mats" and the **Marketer** to "draft initial brand voice."
4.  **Memory**: This entire plan is saved to **Cosmos DB** via `src/lib/db.js`, so the CEO never forgets the mission.

---

## 🎬 Scenario 2: The Hunt (Product Research)

**The Challenge:**
> "I need a product that isn't saturated. Everyone sells yoga mats. Find me something unique."

**The System's Response:**
The CEO pings the Researcher: `POST /api/agent/research/call { "name": "find_winning_products", "arguments": { "category": "Yoga", "criteria": "unique_features" } }`.

**Under the Hood:**
1.  **Deep Dive**: The **Product Research Agent** (`src/agents/productResearchAgent.js`) executes `findWinningProducts`.
2.  **Data Synthesis**: It (conceptually) scans Amazon Best Sellers and TikTok trends. It spots a trend: "Alignment Lines."
3.  **The Eureka Moment**: It returns a structured JSON object:
    ```json
    {
      "product": "Smart Alignment Yoga Mat",
      "reason": "Solves the problem of poor posture. High viral potential on TikTok.",
      "target_price": "$60"
    }
    ```
4.  **Logging**: "Found potential winner: Smart Alignment Mat" is logged to the database.

---

## 🎬 Scenario 3: Building the Store (Shopify Integration)

**The Challenge:**
> "I have the product, but I hate coding. I need a beautiful product page that converts visitors into buyers."

**The System's Response:**
The CEO commands the Builder: `POST /api/agent/store/call { "name": "create_product_page", "arguments": { "product": "Smart Alignment Mat" } }`.

**Under the Hood:**
1.  **Creative Writing**: The **Store Build Agent** (`src/agents/storeBuildAgent.js`) notices the product has no description. It calls OpenAI to write persuasive copy: *"Perfect your downward dog with our patented alignment system."*
2.  **API Magic**: It uses the **Shopify Admin API** (`src/lib/shopify.js`) to:
    *   Upload images.
    *   Set the price to $59.99.
    *   Publish the product to the "Online Store" channel.
3.  **Result**: It returns a live URL: `https://mystore.com/products/smart-alignment-mat`.

---

## 🎬 Scenario 4: The "All-Hands" Meeting (Chat with CEO)

**The User's Question:**
> "I've been away for 3 days. What exactly has the team accomplished?"

**The System's Response:**
The user asks the CEO: `POST /api/chat { "message": "Status report, please." }`.

**Under the Hood:**
1.  **Context Retrieval**: The CEO executes `getRecentLogs(50)` in `src/lib/db.js`. It pulls the raw event stream from Cosmos DB:
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
The CEO activates the Marketer: `POST /api/agent/marketing/call { "name": "create_ad_campaign", "arguments": { "platform": "Facebook" } }`.

**Under the Hood:**
1.  **Ad Copy Gen**: The **Marketing Agent** (`src/agents/marketingAgent.js`) generates 3 hooks:
    *   *Hook A*: "Stop guessing your pose."
    *   *Hook B*: "The yoga mat that teaches you yoga."
    *   *Hook C*: "50% Off Launch Sale."
2.  **Targeting**: It selects interests: "Lululemon," "Yoga Journal," "Mindfulness."
3.  **Execution**: It (conceptually) pushes these assets to the **Meta Ads API**, sets a $50/day budget, and hits "Publish."

---

## 🎬 Scenario 6: Handling Support (Customer Service)

**The Challenge:**
> "A customer just emailed asking if the mat is latex-free. I'm asleep."

**The System's Response:**
The Support Agent wakes up: `POST /api/agent/support/call { "name": "draft_response", "arguments": { "inquiry": "Is this latex-free?" } }`.

**Under the Hood:**
1.  **Knowledge Lookup**: The **Customer Service Agent** (`src/agents/customerServiceAgent.js`) checks the product specs stored in the database.
2.  **Empathy Engine**: It drafts a polite reply: *"Hi there! Yes, our Smart Alignment Mat is made from 100% eco-friendly TPE and is completely latex-free. Safe for all skin types!"*
3.  **Resolution**: The ticket is marked as "Resolved" instantly.

---

## 🛠️ Technical Architecture Summary

1.  **The Brain (AI)**: `src/lib/ai.js` centralizes all calls to Azure OpenAI.
2.  **The Body (Infrastructure)**: `infra/` contains Bicep files that deploy the Container Apps and Cosmos DB.
3.  **The Nervous System (MCP)**: `src/mcp/` defines the JSON-RPC protocol that standardizes how agents receive tasks and return results.
4.  **The Memory (DB)**: `src/lib/db.js` manages the connection to Azure Cosmos DB NoSQL API.
5.  **The Hands (Integrations)**: `src/lib/shopify.js` handles external API calls to the e-commerce platform.


**How it works under the hood:**
1.  **Base Class**: All agents extend `BaseAgent` (`src/agents/base.js`).
2.  **Automatic Logging**:
    *   When `handleToolCall` is triggered, `BaseAgent` logs the tool name and arguments.
    *   When `chat` is called, `CEOAgent` logs the question and answer.
3.  **Persistence**: `saveAgentLog` in `src/lib/db.js` writes a JSON document to the `logs` container in Cosmos DB.
    *   Structure: `{ "agent": "StoreBuilder", "type": "tool_execution", "data": {...}, "timestamp": "..." }`

---

## 🎬 Scenario 6: Marketing Campaign

**User Story:**
> "As the CEO, I need ad copy for Facebook to sell the new mat."

**The Action:**
Task sent to Marketing Agent: `/api/agent/marketing/call` with `{ "name": "generate_ad_copy", "arguments": { "product": "Cork Mat", "platform": "Facebook" } }`.

**How it works under the hood:**
1.  **Tool Execution**: `MarketingAgent.generateAdCopy()` runs.
2.  **Prompt Engineering**: The agent constructs a prompt specific to Facebook (short, emoji-heavy, CTA-focused).
3.  **AI Generation**: OpenAI returns the copy.
4.  **Output**: The agent returns the text, which the CEO (or user) can then use in the next step (e.g., sending to a Facebook Ads API if implemented).

---

## 🎬 Scenario 7: Handling Support (Customer Service)

**User Story:**
> "A customer asks: 'Do you ship to Canada?'"

**The Action:**
Task sent to Support Agent: `/api/agent/support/call` with `{ "name": "draft_response", "arguments": { "inquiry": "Do you ship to Canada?" } }`.

**How it works under the hood:**
1.  **Tool Execution**: `CustomerServiceAgent.draftResponse()` runs.
2.  **Policy Check**: (In a full implementation, this would check a knowledge base). Currently, it uses AI to draft a polite, standard response based on general e-commerce best practices.
3.  **Review**: The draft is returned for human or CEO approval.

---

## 🛠️ Technical Architecture Summary

1.  **The Brain (AI)**: `src/lib/ai.js` centralizes all calls to Azure OpenAI.
2.  **The Body (Infrastructure)**: `infra/` contains Bicep files that deploy the Container Apps and Cosmos DB.
3.  **The Nervous System (MCP)**: `src/mcp/` defines the JSON-RPC protocol that standardizes how agents receive tasks and return results.
4.  **The Memory (DB)**: `src/lib/db.js` manages the connection to Azure Cosmos DB NoSQL API.
5.  **The Hands (Integrations)**: `src/lib/shopify.js` handles external API calls to the e-commerce platform.
