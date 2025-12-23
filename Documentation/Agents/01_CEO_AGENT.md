# 👔 01. CEO Agent (The Orchestrator)

## 1. Executive Summary
The **CEO Agent** is the central nervous system of the DropShip AI enterprise. Its primary role is **Orchestration** and **Decision Making**. It breaks down high-level goals into actionable steps for the swarm, approves critical transitions (like spending money), and acts as the primary interface for the human user.

## 2. Core Responsibilities
*   **Strategic Planning**: Decomposes user goals (e.g., "Find pet products") into agent commands.
*   **Workflow Orchestration**: Manages the lifecycle of a product, ensuring smooth hand-offs between Research, Sourcing, and Marketing.
*   **Risk Management**: Acts as a "Gatekeeper" for budget allocation, approving or rejecting products and suppliers based on data.
*   **Human Interface**: Synthesizes complex system logs into simple briefings and executes natural language commands.

## 3. Event Interface

### Subscribes To
| Event | Source | Action |
| :--- | :--- | :--- |
| `OpportunityResearch.BriefsPublished` | Research Agent | Receives completed research briefs and stages them for manual review via `ResearchStagingService`. |
| `Sales.OrderReceived` | Sales System | Logs a celebratory message and updates internal financial context. |
| `System.Error` | Any Agent | Logs the error for high-level visibility. |

### Publishes
| Event | Payload | Description |
| :--- | :--- | :--- |
| `Product.Approved` | `{ product, reason }` | (Legacy/Manual) Signals approval of a product. |
| `Supplier.Approved` | `{ product, supplier }` | (Legacy/Manual) Signals approval of a supplier. |

> **Note**: The CEO primarily acts via the **Staging Service** (database) rather than direct event publication for the core research loop. Research outputs are "staged" and await human approval in the Control Panel.

## 4. Toolbox (MCP)

The CEO uses a suite of "Meta-Tools" to control the simulation and other agents.

| Tool Name | Description | Parameters |
| :--- | :--- | :--- |
| `approveProduct` | Approves a product for sale. | `reason` (string) |
| `rejectProduct` | Rejects a product candidate. | `reason` (string) |
| `approveSupplier` | Approves a supplier for a product. | `reason` (string) |
| `rejectSupplier` | Rejects a supplier. | `reason` (string) |
| `startProductResearch` | Commands Research Agent to start. | `category` (string) |
| `sourceProduct` | Commands Supplier Agent to source. | `productId` (string) |
| `buildStorePage` | Commands Store Agent to build. | `productId` (string) |

## 5. Key Logic & Decision Making

### The Approval Gate
The CEO does not blindly approve everything. It uses the `AiAdapter` to evaluate data against set criteria:
*   **Product Viability**: Is the "Demand Score" > 70? Is the competition low?
*   **Margin Check**: `Retail Price - (COGS + Shipping + CPA)` must be > 20%.
*   **Supplier Reliability**: Shipping time must be < 15 days.

### Emergency Brakes
If the `AnalyticsAgent` reports a ROAS (Return on Ad Spend) below 1.0, the CEO has the authority to override the `MarketingAgent` and pause campaigns immediately to save budget.

## 6. Current Status
*   **Implementation**: Live.
*   **Logic**: Fully implemented. Orchestrates Research, Sourcing, and Marketing.
*   **AI Integration**: Connected to Azure OpenAI via `LiveAiAdapter`.
*   **New Features**: "Narrative Mode" allows the CEO to explain complex logs in plain English.

## 8. Technical Implementation Details

### 8.1 Class Structure
The `CEOAgent` extends `BaseAgent` and integrates with the following ports:
*   **`AiPort`**: Interface for LLM interactions (Azure OpenAI).
*   **`PersistencePort`**: Database access for logs, products, orders, and campaigns.
*   **`EventBusPort`**: Pub/Sub system for inter-agent communication.
*   **`ResearchStagingService`**: Manages the staging area for human-in-the-loop reviews.

### 8.2 Core Methods

#### `chat(userMessage: string, mode?: string)`
The primary interaction loop for the Control Panel chat interface.
1.  **Context Retrieval**: Fetches the last 50 logs, active products, recent orders, and active campaigns from the database.
2.  **Prompt Construction**: Builds a dynamic system prompt containing a "Business Snapshot" (financials, portfolio, activity).
3.  **AI Execution**: Calls `AiPort.chat` with the user message and available tools.
4.  **Tool Execution**: If the AI elects to call a tool (e.g., `startProductResearch`), the method executes the corresponding logic and returns the result to the chat.

#### `askAboutProduct(query: string)`
Generates the "Narrative" status report.
1.  **Fuzzy Resolution**: Accepts a Request ID (`req_...`), Product ID (`prod_...`), or Product Name (e.g., "Gaming Chair").
    *   If a name is provided, it performs a fuzzy search (`ILIKE`) to find the Product ID.
    *   It then traces the Product ID back to the original Research Request ID to capture the full history.
2.  **Recursive Log Fetching**:
    *   Fetches logs for the Request ID.
    *   Scans for linked entities (e.g., `metadata.productId`) and recursively fetches logs for those entities (Supplier, Marketing).
    *   Merges and sorts all logs to create a unified timeline.
3.  **Analysis**:
    *   **Failure Analysis**: Uses `FailureAnalyzer` to detect patterns like Rate Limits, No Signals, or Strategic Misalignment.
    *   **Workflow Tracking**: Compares logs against the `ProductResearchWorkflow` definition to calculate progress (e.g., "Step 5 of 11").
4.  **Synthesis**: Prompts the LLM to tell a "Hero's Journey" story:
    *   **The Quest**: Research phase.
    *   **The Discovery**: Product finding.
    *   **The Execution**: Sourcing and Marketing.
    *   **The Outcome**: Current status and next steps.

#### `evaluateProduct(product: any)`
The decision engine for product approval.
*   **Simulation Mode**: Auto-approves products to ensure rapid testing cycles.
*   **Live Mode**: Prompts the AI with a "Strict CEO" persona to evaluate the product based on description and price. It expects the AI to call `approveProduct` or `rejectProduct`.

#### `stageBriefs(payload: any)`
Handles the output of the Research Agent.
1.  **Session Management**: Checks for an existing staging session or creates a new one.
2.  **Staging**: Converts `OpportunityBrief` objects into staged items (`status: 'pending'`) for manual review in the UI.

### 8.3 Prompts & Personas

*   **General Chat**: "You are the CEO of a dropshipping company. You have access to the real-time state of your business... Answer based strictly on the data above."
*   **Narrative**: "You are the CEO. You are reviewing the progress of a product research initiative... Tell it as a story. Highlight key decisions, findings, and current status."
*   **Evaluation**: "You are a strict CEO. Evaluate the product proposal... Should we sell this?"
*   **Planning**: "You are the CEO... Your goal is to orchestrate a team of agents... Break down the user's goal into a high-level strategy..."

### 8.4 Event Subscriptions

| Event Topic | Handler Logic |
| :--- | :--- |
| `System.Error` | Logs the error for visibility. |
| `Sales.OrderReceived` | Logs a celebratory message with order details. |
| `OpportunityResearch.BriefsPublished` | Triggers `stageBriefs` to queue items for review. |

### 8.5 MCP Tool Definitions
The CEO exposes the following tools to the LLM:
*   `approveProduct` / `rejectProduct`: Decision tools.
*   `approveSupplier` / `rejectSupplier`: Decision tools.
*   `startProductResearch`: Delegated command to Research Agent.
*   `sourceProduct`: Delegated command to Supplier Agent.
*   `buildStorePage`: Delegated command to Store Agent.
*   `launchMarketingCampaign`: Delegated command to Marketing Agent.

### 8.6 Helper Components

#### `FailureAnalyzer`
A static analysis class that parses raw log messages to identify root causes of failures.
*   **Rate Limits**: Detects "429" or "quota" errors.
*   **No Signals**: Detects empty search results.
*   **Strategic Misalignment**: Detects rejections based on `StrategyProfile`.
*   **Dependency Failures**: Detects missing system components.

#### `StrategyProfile`
A centralized definition of the company's strategic goals, used by the CEO to explain *why* decisions were made.
*   **Allowed Categories**: e.g., "Fitness", "Home", "Pet".
*   **Risk Tolerance**: "Low", "Medium", "High".
*   **Target Margin**: e.g., 30%.

#### `ProductResearchWorkflow`
A formal definition of the 11-step research pipeline.
*   Used to map log messages to specific workflow steps (e.g., "Step 5: Gating").
*   Allows the CEO to report exact progress percentages (e.g., "45% Complete").

## 9. Planned Updates (Phased Roadmap)

To ensure the CEO evolves from a simple interface into a true strategic partner, the following roadmap is established.

### Phase 1: Cross-Departmental Omniscience (The "Company Operator" CEO)
**Goal**: Connect the CEO to the pulse of Supply Chain, Marketing, and Sales.

#### Implementation Plan
1.  **Supply Chain Integration**:
    *   Update `SupplierAgent` to emit structured events for `StockCheck` and `SupplierFound`.
    *   Update `CEOAgent.chat` to query the `inventory` and `suppliers` tables.
2.  **Marketing Intelligence**:
    *   Update `MarketingAgent` to log daily campaign metrics (ROAS, CTR, CPC) to a `campaign_metrics` table.
    *   Update `CEOAgent` to retrieve "Top 5 Performing Campaigns" and "Bottom 5 Campaigns" for the chat context.
3.  **Financial Context**:
    *   Create a `FinancialService` that aggregates Revenue (from Orders), COGS (from Products), and AdSpend (from Campaigns).
    *   Inject a `FinancialSnapshot` object into the CEO's system prompt (e.g., `{ daily_profit: 120, margin: 0.15 }`).
4.  **Testing & Validation**:
    *   **Unit Tests**: Verify `FinancialService` calculations (Revenue - COGS - AdSpend) with edge cases (e.g., zero revenue).
    *   **Mock Tests**: Simulate `MarketingAgent` emitting campaign metrics and verify they are correctly stored and retrieved by the CEO.

### Phase 3: Proactive Intelligence (The "Strategic Partner" CEO)
**Goal**: Move from reactive (answering questions) to proactive (offering advice).

#### Implementation Plan
1.  **Background Monitoring**:
    *   Implement a `CronJob` within `CEOAgent` (or a separate `WatcherService`) that runs every hour.
    *   Define thresholds for critical metrics (e.g., "ROAS < 1.5", "Inventory < 10").
2.  **Proactive Alerting**:
    *   If a threshold is breached, publish a `CEO.Alert` event.
    *   The Control Panel listens for this event and displays a notification to the user.
3.  **Strategic Recommendations**:
    *   Implement a weekly "Strategy Run" where the CEO analyzes the last 7 days of sales data.
    *   Use the LLM to generate 3 actionable recommendations (e.g., "Increase budget on Campaign A", "Kill Product B", "Research new category C").
4.  **Testing & Validation**:
    *   **Unit Tests**: Test the `CronJob` scheduler and threshold logic (e.g., ensure alerts trigger *only* when thresholds are crossed).
    *   **Scenario Tests**: Simulate a "Sales Drop" scenario and verify the CEO generates the correct strategic recommendation.
    *   Use the LLM to generate 3 actionable recommendations (e.g., "Increase budget on Campaign A", "Kill Product B", "Research new category C").



