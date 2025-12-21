# 📋 CEO Agent Implementation Plan

This document breaks down the roadmap from `CEO_AGENT_DEEP_DIVE.md` into actionable engineering tasks.

---

## Phase 1: Foundation & Connectivity (✅ Partially Complete)
**Goal:** Establish the communication channels between the User, the CEO Agent, and the AI Backend (Mock & Live).

### 1.1. AI Adapter Pattern (✅ Done)
*   [x] Define `AiPort` interface.
*   [x] Implement `MockAiAdapter` for simulation/testing.
*   [x] Implement `LiveAiAdapter` for Azure OpenAI.
*   [x] Update `CEOAgent` to use dependency injection for the AI provider.

### 1.2. Chat Interface Wiring (✅ Done)
*   [x] Create "Chat with CEO" UI in `admin.html`.
*   [x] Create `/api/ceo/chat` endpoint in `index.ts`.
*   [x] Connect UI -> API -> CEO Agent -> AI Adapter.

### 1.3. Context Awareness (🚧 In Progress)
*   [ ] **Task:** Improve the `systemPrompt` in `CEOAgent.chat()`.
    *   *Current:* Just dumps raw logs.
    *   *Required:* Summarize logs by category (e.g., "Errors", "Sales", "New Products") to save token space and improve reasoning.
*   [ ] **Task:** Add "System State" to the prompt.
    *   Inject current active products and their status (e.g., "Product X: Waiting for Approval").

---

## Phase 2: The "Approver" (Tools & Control)
**Goal:** Give the CEO the ability to execute code, not just talk.

### 2.1. Tool Definition
*   [ ] **Task:** Define the `CeoTools` interface.
    ```typescript
    interface CeoTools {
        approveProduct(productId: string): Promise<void>;
        rejectProduct(productId: string, reason: string): Promise<void>;
        pauseSystem(): Promise<void>;
    }
    ```

### 2.2. Function Calling (The "Hands")
*   [ ] **Task:** Update `LiveAiAdapter` to support OpenAI Function Calling (Tools API).
    *   Define the JSON schema for `approve_product`, `reject_product`, etc.
    *   Pass these schemas to the OpenAI API call.
*   [ ] **Task:** Update `CEOAgent` to handle tool calls returned by the AI.
    *   If AI returns `tool_calls`, execute the corresponding method in `CEOAgent`.

### 2.3. Simulation Integration
*   [ ] **Task:** Modify `SimulationService.ts` to pause and wait for approval.
    *   *Current:* Research -> Supplier -> Store (Automatic).
    *   *New:* Research -> **WAIT FOR APPROVAL** -> Supplier.
*   [ ] **Task:** Update `MockAiAdapter` to simulate tool usage.
    *   If user says "Approve product 123", the mock should return a canned response *and* trigger the approval logic internally.

---

## Phase 3: Reporting & Intelligence
**Goal:** Enable the CEO to generate structured business reports.

### 3.1. Data Retrieval Tools
*   [ ] **Task:** Implement `AnalyticsPort` for the CEO.
    *   Allow CEO to call `analytics.getDailyProfit()`, `analytics.getRoas()`.
*   [ ] **Task:** Expose these as tools to the AI (`get_metrics`).

### 3.2. Report Generation
*   [ ] **Task:** Create a specific prompt/mode for "Reporting".
    *   When user asks "Report", use a specialized system prompt focused on data synthesis and Markdown formatting.

---

## Phase 4: Event-Driven Autonomy (The "Autopilot")
**Goal:** Move away from the linear `SimulationService` script entirely.

### 4.1. Event Bus Implementation
*   [ ] **Task:** Create a robust `EventBus` (in-memory for now).
    *   `subscribe(event, callback)`
    *   `publish(event, payload)`
*   [ ] **Task:** Refactor all Agents to emit events instead of just returning values.

### 4.2. CEO as Event Listener
*   [ ] **Task:** Create `CEOAgent.onEvent(event)` handler.
    *   Listen for `RESEARCH_COMPLETED`.
    *   Automatically evaluate the product (using LLM) and decide to Approve/Reject without human input (if confidence is high).

---

## 🛠️ Setup Instructions

### 1. OpenAI Setup (Live Mode)
To enable the "Real" CEO:
1.  Get an Azure OpenAI Endpoint & Key.
2.  Create a `.env` file in `c:\DropShip\DS1`:
    ```env
    AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
    AZURE_OPENAI_KEY=your_key_here
    AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
    ```
3.  Restart server: `npm start` (or use the Infra Manager to toggle CEO Mode to "Live").

### 2. Simulation Mode (Mock Mode)
To test without spending money:
1.  Ensure `CEO Agent Mode` is set to **Mock** in the Infra Manager.
2.  The `MockAiAdapter` will intercept chat messages.
3.  You can customize the mock responses in `src/infra/ai/MockAiAdapter.ts`.
