# Gap Analysis: Current vs. Target Architecture

This document outlines the specific code changes required to move from the current "Monolithic/RPC" architecture to the "Event-Driven/MCP" target state.

## 1. Event Bus Integration (Critical Gap)

**Current State:**
*   `PostgresEventStore` exists in `src/infra/eventbus/` but is **dead code**.
*   `src/index.ts` does not instantiate an Event Bus.
*   Agents communicate via direct method calls (e.g., `this.team.research.findWinningProducts()`).

**Required Changes:**
1.  **Instantiate Event Bus:** In `src/index.ts`, create an instance of `PostgresEventStore` (or a Redis-based one for live).
2.  **Inject into Agents:** Update `BaseAgent` constructor to accept `EventBusPort`.
3.  **Refactor Communication:**
    *   **CEO Agent:** Instead of calling `this.team.research.findWinningProducts()`, emit `RESEARCH_REQUESTED` event.
    *   **Research Agent:** Subscribe to `RESEARCH_REQUESTED`. When finished, emit `RESEARCH_COMPLETED`.
    *   **CEO Agent:** Subscribe to `RESEARCH_COMPLETED` to proceed to the next step.

## 2. Webhook Ingress

**Current State:**
*   No webhook routes defined in `src/index.ts`.
*   System is driven solely by `SimulationService` (script) or `POST /api/ceo/chat` (user).

**Required Changes:**
1.  **Create Webhook Routes:** Add `src/api/webhook-routes.ts`.
2.  **Implement Handlers:**
    *   `POST /webhooks/shopify/orders/create` -> Emits `ORDER_CREATED` event.
    *   `POST /webhooks/meta/ads/lead` -> Emits `LEAD_GENERATED` event.
3.  **Verify Signatures:** Implement middleware to verify HMAC signatures from Shopify/Meta.

## 3. MCP Tool Protocol

**Current State:**
*   Agents extend `MCPServer`, but `handleToolCall` is mostly an internal wrapper.
*   Adapters are injected directly into Agents (e.g., `new ProductResearchAgent(db, trendAdapter)`).

**Required Changes:**
1.  **Formalize Tool Definitions:** Ensure every Adapter method (e.g., `trendAdapter.analyze()`) is exposed as a formal MCP Tool (JSON Schema).
2.  **Standardize Execution:** Agents should execute tools via `this.callTool('analyze_trends', args)` rather than `this.trendAdapter.analyze(args)`. This allows for easier interception, logging, and potential remote execution later.

## 4. Simulation Service Refactoring

**Current State:**
*   `SimulationService.ts` is a procedural script that manually steps through the workflow.

**Required Changes:**
*   **Event-Driven Simulation:** The `SimulationService` should become a "Chaos Monkey" or "Scenario Injector" that simply emits initial events (e.g., `MARKET_TREND_DETECTED`) and lets the agents react naturally, rather than micromanaging the flow.

## Summary of Work

| Area | Task | Complexity |
| :--- | :--- | :--- |
| **Event Bus** | Wire up `PostgresEventStore` in `index.ts` | Low |
| **Agents** | Refactor `CEOAgent` to use Events instead of `this.team` | High |
| **Webhooks** | Create `webhook-routes.ts` | Medium |
| **MCP** | Wrap Adapter calls in `callTool` pattern | Medium |
