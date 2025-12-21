# Plan: System-Wide Event-Driven Architecture Migration

## 1. Executive Summary
This plan outlines the strategy to migrate the **entire DS1 application** (Simulation, Live Mode, and all Agents) to a fully **Event-Driven Architecture (EDA)**.

Currently, the system uses a mix of direct method calls (tight coupling) and some event logging. The goal is to decouple all services so that Agents, Services, and the UI communicate exclusively via the `EventBus`.

---

## 2. Core Architecture Principles

1.  **Async by Default:** No service should `await` another service's internal logic. They should `publish` a request and `subscribe` to the result.
2.  **Universal Event Bus:** A single, typed Event Bus (backed by Postgres for persistence/audit) will handle all inter-agent communication.
3.  **State Recovery:** The system state should be reconstructible by replaying events from the `events` table.
4.  **Observability:** The UI will subscribe to the Event Bus to show real-time updates, replacing polling where possible.

---

## 3. Event Taxonomy (Global)

We will define a global registry of events in `src/core/domain/events/Registry.ts`.

| Domain | Event Name | Trigger | Payload |
| :--- | :--- | :--- | :--- |
| **Research** | `Research.Requested` | User/System asks for product | `{ request_id, criteria }` |
| | `Research.BriefPublished` | Agent finds opportunity | `{ brief_id, brief_json }` |
| **Sourcing** | `Sourcing.FeasibilityRequested` | Research hands off to Sourcing | `{ brief_id }` |
| | `Sourcing.SupplierFound` | Supplier identified | `{ supplier_id, cost }` |
| **Marketing** | `Marketing.CampaignRequested` | Product ready for ads | `{ product_id }` |
| | `Marketing.AdLaunched` | Ad live on platform | `{ ad_id, platform }` |
| **Sales** | `Sales.OrderReceived` | Webhook from Shopify | `{ order_id, items }` |
| **System** | `System.Error` | Any failure | `{ error, context }` |

---

## 4. Migration Phases

### Phase 1: Infrastructure Hardening
**Goal:** Ensure the Event Bus is robust enough to be the system backbone.

1.  **Typed Event Bus:** Refactor `EventBusPort` to enforce strict typing for event names and payloads.
2.  **Event Registry:** Create a central file defining all allowed events.
3.  **Postgres Optimization:** Ensure the `events` table is indexed for high-throughput reads/writes (since everything will go through it).

### Phase 2: The "Research" Vertical (Pilot)
**Goal:** Migrate the Product Research flow first (as defined in the MVP Plan).

1.  **Refactor `ProductResearchAgent`:** Make it purely reactive (listen for `Research.Requested`).
2.  **Refactor `SimulationService`:** Remove direct calls to Research Agent. Publish events instead.
3.  **Verify:** Ensure the UI still updates correctly via the Activity Log (which now reads from the Event Bus).

### Phase 3: The "Execution" Vertical (Sourcing & Marketing)
**Goal:** Decouple the downstream agents.

1.  **Sourcing Agent:** Update to listen for `Research.BriefPublished`. It should automatically start finding suppliers when a brief appears.
2.  **Marketing Agent:** Update to listen for `Sourcing.SupplierFound` (or `Product.Ready`).
3.  **Orchestrator Removal:** The `SimulationService` logic that "chains" these calls together should be removed. The events themselves form the chain.

### Phase 4: The "Live" Vertical (CEO & API)
**Goal:** Ensure user interactions trigger events.

1.  **API Routes:** `POST /api/research` should just publish `Research.Requested` and return the `request_id`.
2.  **CEO Agent:** The CEO should consume high-level events (`Sales.OrderReceived`, `System.Error`) and publish command events (`Strategy.Update`).

### Phase 5: Cleanup & UI Real-time
**Goal:** Remove legacy code and improve UX.

1.  **Delete Legacy Methods:** Remove the old direct-call methods from Agents.
2.  **WebSockets (Optional):** Connect the backend Event Bus to the frontend via Socket.io or SSE for true real-time updates (replacing polling).

---

## 5. Task List

- [x] **Phase 1: Infrastructure**
    - [x] Create `src/core/domain/events/Registry.ts`
    - [x] Update `EventBusPort` interface
    - [x] Optimize `events` table in Postgres

- [ ] **Phase 2: Research Vertical**
    - [ ] Migrate `ProductResearchAgent` to Event Bus
    - [ ] Update `SimulationService` (Research Phase)
    - [ ] Test Research Flow

- [ ] **Phase 3: Execution Vertical**
    - [ ] Migrate `SupplierAgent`
    - [ ] Migrate `MarketingAgent`
    - [ ] Update `SimulationService` (Launch Phase)

- [ ] **Phase 4: Live Vertical**
    - [ ] Update API Endpoints
    - [ ] Update `CEOAgent`

- [ ] **Phase 5: Cleanup**
    - [ ] Remove unused synchronous methods
    - [ ] (Optional) Implement SSE/WebSockets
