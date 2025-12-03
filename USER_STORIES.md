# 📖 User Stories & Technical Scenarios

This document explains how the **Agentic AI Dropshipping Platform** works by walking through the lifecycle of a business. It maps user goals to specific agents, files, and code methods.

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

**User Story:**
> "As a user, I want to tell the system my high-level goal so that it can create a concrete plan of action."

**The Action:**
User sends a POST request to `/api/agent/ceo/plan` with `{ "goal": "Start a yoga mat business" }`.

**How it works under the hood:**
1.  **Entry Point**: `src/index.js` receives the request. It routes it to the `CEOAgent`.
2.  **Method Call**: `CEOAgent.handlePlanRequest(message)` is triggered.
3.  **AI Processing**: The CEO uses `src/lib/ai.js` (OpenAI GPT-4) to break the vague goal into a structured JSON strategy (e.g., "1. Research Trends, 2. Source Mats, 3. Build Store").
4.  **Logging**: The CEO calls `this.log()` (inherited from `src/agents/base.js`), which saves the plan to Cosmos DB via `src/lib/db.js`.

---

## 🎬 Scenario 2: The Hunt (Product Research)

**User Story:**
> "As the CEO (or user), I want to find trending products in the 'Yoga' niche."

**The Action:**
User (or CEO) sends a task to the Researcher: `/api/agent/research/call` with `{ "name": "find_winning_products", "arguments": { "category": "Yoga" } }`.

**How it works under the hood:**
1.  **Routing**: `src/index.js` routes to `ProductResearchAgent`.
2.  **Tool Execution**: The agent looks up the tool `find_winning_products` in its registry (registered in constructor).
3.  **Logic**: `ProductResearchAgent.findWinningProducts()` executes.
    *   It prompts GPT-4 to brainstorm 3 viral yoga products.
    *   It returns a JSON list of products (e.g., "Cork Yoga Mat", "Smart Alignment Mat").
4.  **State**: The agent automatically logs "Research Completed" to Cosmos DB via `BaseAgent.log()`.

---

## 🎬 Scenario 3: Building the Store (Shopify Integration)

**User Story:**
> "As the CEO, I want to take the 'Cork Yoga Mat' we found and list it on our Shopify store."

**The Action:**
A task is sent to the Store Builder: `/api/agent/store/call` with `{ "name": "create_product_page", "arguments": { "product_data": { "name": "Cork Mat", "price": 50 } } }`.

**How it works under the hood:**
1.  **Tool Execution**: `StoreBuildAgent.createProductPage()` is called.
2.  **Content Gen**: If the product lacks a description, the agent uses `generateDescription()` (calling OpenAI) to write SEO-friendly copy.
3.  **Shopify API**: The agent uses `src/lib/shopify.js` to authenticate with Shopify.
4.  **API Call**: It sends a POST request to Shopify's Admin API (`/admin/api/2024-01/products.json`) to create the product.
5.  **Result**: Returns the new product's URL.

---

## 🎬 Scenario 4: The "All-Hands" Meeting (Chat with CEO)

**User Story:**
> "As a user, I want to ask the CEO what the team has been doing, without checking logs manually."

**The Action:**
User sends a POST request to `/api/chat` with `{ "message": "What's the status of the yoga store?" }`.

**How it works under the hood:**
1.  **Entry Point**: `src/index.js` handles the `/api/chat` route.
2.  **Method Call**: `CEOAgent.chat("What's the status...")` is called.
3.  **Memory Retrieval**:
    *   The CEO calls `getRecentLogs(50)` from `src/lib/db.js`.
    *   This executes a SQL query against Cosmos DB: `SELECT * FROM c ORDER BY c.timestamp DESC`.
4.  **Context Construction**: The logs (e.g., "Researcher found Cork Mat", "StoreBuilder created page") are formatted into a text block.
5.  **Synthesis**: The CEO sends the logs + user question to GPT-4: *"Based on these logs, answer the user."*
6.  **Response**: "We have successfully identified a Cork Yoga Mat and created the product page on Shopify. We are ready for marketing."

---

## 🎬 Scenario 5: Observability (The Database)

**User Story:**
> "As a developer, I want to ensure every action is recorded for debugging and history."

**The Action:**
Any agent performs any action.

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
