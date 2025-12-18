# Plan: Product Research Agent MVP Implementation

## 1. Executive Summary
This plan outlines the implementation of the **Minimum Viable Product Research Agent (MV-PRA)** as defined in `doc_5_minimum_viable_product_research_agent.md`.

The goal is to transition from the current synchronous, list-based search to an **asynchronous, event-driven, schema-validated workflow**. We will maintain the "structure" (EventBus, Opportunity Brief) while reducing the "breadth" (using only 3 signal sources).

---

## 2. Target Architecture (MVP)

### 2.1 Workflow
1.  **Trigger:** `SimulationService` (or `CEOAgent`) publishes `OpportunityResearch.Requested`.
2.  **Agent Action:** `ProductResearchAgent` consumes the event.
3.  **Execution:**
    *   **Step 1 (Intake):** Validates request, checks "Enterprise Memory" (stubbed for MVP).
    *   **Step 2 (Signals):** Queries BigQuery (Search) + OpenAI (Social/Marketplace proxies).
    *   **Step 3 (Synthesis):** Generates a strict `OpportunityBrief` JSON.
    *   **Step 4 (Gate):** Applies "Kill Criteria" (e.g., low profit, high risk).
4.  **Output:** Agent publishes `OpportunityResearch.BriefsPublished`.
5.  **Completion:** `SimulationService` consumes the brief and logs the result.

### 2.2 Signal Sources (Reduced Scope)
1.  **Search Intent:** Google BigQuery (Existing).
2.  **Social Momentum:** OpenAI Proxy (Simulated analysis of "social trends" based on keywords).
3.  **Marketplace Movement:** OpenAI Proxy (Simulated analysis of "competitor density").

---

## 3. Implementation Phases

### Phase 1: Foundation (Schema & Events)
**Goal:** Define the contracts that the system will enforce.

1.  **Define Events:**
    *   Create `src/core/domain/events/ResearchEvents.ts`.
    *   Define `OpportunityResearch.Requested` and `OpportunityResearch.BriefsPublished`.
2.  **Define Schema:**
    *   Create `src/core/domain/types/OpportunityBrief.ts` (from Blueprint 08).
    *   Create `src/core/domain/schemas/OpportunityBriefSchema.ts` (Zod validation).
3.  **Database Update:**
    *   Create `opportunity_briefs` table in Postgres (via `setup_federation.ps1` or migration script).
    *   Update `PostgresAdapter` to support saving/loading briefs.

### Phase 2: Agent Refactoring (The "Thinking" Loop)
**Goal:** Rewrite `ProductResearchAgent` to follow the Doc 1 Checklist.

1.  **Event Subscription:**
    *   Update `ProductResearchAgent` to subscribe to `OpportunityResearch.Requested`.
2.  **Brief Generation Logic:**
    *   Implement `generateOpportunityBrief(signals)` method.
    *   Use OpenAI to synthesize the `OpportunityBrief` JSON, strictly adhering to the Zod schema.
    *   *Prompt Engineering:* "You are a Product Researcher. Given these BigQuery trends, generate a JSON object matching this specific schema..."
3.  **Signal Aggregation:**
    *   Modify `findWinningProducts` logic to return raw signals instead of a final product list.
    *   Combine BigQuery results with AI-generated "Social" and "Marketplace" context.

### Phase 3: Orchestrator Update (SimulationService)
**Goal:** Make the simulation event-driven.

1.  **Remove Direct Calls:** Delete `await agent.findWinningProducts()`.
2.  **Publish & Wait:**
    *   Update `runResearchPhase` to publish `OpportunityResearch.Requested`.
    *   Implement a listener/poller to wait for the `BriefsPublished` event (or just log it asynchronously).
3.  **UI Feedback:**
    *   Ensure the "Activity Log" in the UI correctly displays these new async events.

### Phase 4: Validation & Tuning
**Goal:** Ensure the agent produces *valid* briefs that pass the schema check.

1.  **Unit Testing:** Test the Zod schema against AI-generated outputs.
2.  **Prompt Tuning:** Refine the system prompt to ensure the AI understands "Kill Criteria" and "Risk Assessment".
3.  **End-to-End Test:** Run a full simulation cycle and verify a Brief appears in the database.

---

## 4. Task List

- [ ] **Phase 1: Foundation**
    - [ ] Create `ResearchEvents.ts`
    - [ ] Create `OpportunityBrief.ts` & `OpportunityBriefSchema.ts`
    - [ ] Update Postgres Schema (`opportunity_briefs` table)
    - [ ] Update `PostgresAdapter` methods

- [ ] **Phase 2: Agent Logic**
    - [ ] Implement `handleResearchRequest` in `ProductResearchAgent`
    - [ ] Implement `collectSignals` (BigQuery + AI Proxies)
    - [ ] Implement `synthesizeBrief` (OpenAI + Zod Validation)
    - [ ] Implement `publishBrief`

- [ ] **Phase 3: Orchestration**
    - [ ] Update `SimulationService` to use EventBus
    - [ ] Verify UI logging

- [ ] **Phase 4: Verification**
    - [ ] Run `test_trends.ts` (or equivalent) to validate flow
    - [ ] Check `opportunity_briefs` DB table for data
