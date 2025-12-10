# 🤖 Agent Documentation Update Plan

## 🎯 Objective
To create comprehensive, standardized documentation for all 8 agents in the DropShip AI swarm. This ensures that the "Brain" of the system is as well-documented as the "Body" (Workflows).

## 📋 The Standard Template
Each agent document will follow this structure:

1.  **Executive Summary**: One-line description of the agent's role (e.g., "The Hunter", "The Steward").
2.  **Core Responsibilities**: Bullet points of what it actually does.
3.  **Event Interface**:
    *   **Subscribes To**: Which events trigger this agent?
    *   **Publishes**: Which events does this agent emit?
4.  **Toolbox (MCP)**: List of tools registered and used (e.g., `trend_tool`, `shopify_tool`).
5.  **Key Logic**: Brief explanation of decision-making processes (e.g., "If ROAS < 1.5, kill campaign").
6.  **Current Status**: Implementation level (Mock vs. Real).

## 📅 The Rollout Plan

### Phase 1: The Executive Team (Strategy)
*   [ ] **`01_CEO_AGENT.md`** (Update existing `CEO_AGENT_DEEP_DIVE.md`)
    *   *Focus:* Orchestration, Approval Gates, and User Interface.
*   [ ] **`02_ANALYTICS_AGENT.md`**
    *   *Focus:* Data aggregation, Reporting, and Forecasting logic.

### Phase 2: The Growth Team (Offense)
*   [ ] **`03_PRODUCT_RESEARCH_AGENT.md`**
    *   *Focus:* Trend analysis, Competitor scraping, and Niche selection.
*   [ ] **`04_SUPPLIER_AGENT.md`**
    *   *Focus:* Sourcing, Margin calculation, and Supplier vetting.
*   [ ] **`05_STORE_BUILD_AGENT.md`**
    *   *Focus:* Shopify integration, Product page generation, and Pricing.
*   [ ] **`06_MARKETING_AGENT.md`**
    *   *Focus:* Ad creation, Campaign management, and Budget allocation.

### Phase 3: The Operations Team (Defense)
*   [x] **`07_OPERATIONS_AGENT.md`**
    *   *Focus:* Order fulfillment, Inventory management, and Logistics.
*   [x] **`08_CUSTOMER_SERVICE_AGENT.md`**
    *   *Focus:* Ticket handling, Sentiment analysis, and Email communication.

## 🛠️ Action Items
1.  **Rename** `CEO_AGENT_DEEP_DIVE.md` to `01_CEO_AGENT.md` and refactor content to match the template. (Done)
2.  **Archive** `CEO_AGENT_IMPLEMENTATION_PLAN.md` (or merge relevant parts into the new doc). (Done)
3.  **Create** the remaining 7 documents based on the source code in `src/agents/`. (Done)

## ✅ Status
**All Agent Documentation is Complete.** The `Documentation/Agents` folder now accurately reflects the codebase.
