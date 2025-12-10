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
| `PRODUCT_FOUND` | Research Agent | Reviews product viability. Triggers `approveProduct` or `rejectProduct`. |
| `SUPPLIER_FOUND` | Supplier Agent | Reviews supplier costs and shipping times. Triggers `approveSupplier` or `rejectSupplier`. |
| `ALERT_CRITICAL` | Analytics Agent | Takes emergency action (e.g., pausing ads) if metrics tank. |

### Publishes
| Event | Payload | Description |
| :--- | :--- | :--- |
| `PRODUCT_APPROVED` | `{ product }` | Signals the Supplier Agent to start sourcing. |
| `PRODUCT_REJECTED` | `{ product, reason }` | Ends the workflow for a specific product candidate. |
| `SUPPLIER_APPROVED` | `{ supplier }` | Signals the Store Agent to build the product page. |
| `SUPPLIER_REJECTED` | `{ supplier, reason }` | Requests the Supplier Agent to find an alternative. |
| `COMMAND_START` | `{ type }` | Initiates a new workflow (e.g., Research). |

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
*   **Implementation**: Partial Real / Partial Mock.
*   **Logic**: The `CEOAgent` class is fully implemented with tool definitions and event subscriptions in `test-full-workflow.ts`.
*   **AI Integration**: Uses `MockAiAdapter` for testing, ready for `OpenAiAdapter`.
