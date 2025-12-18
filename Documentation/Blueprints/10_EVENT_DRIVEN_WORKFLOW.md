# Blueprint: Event-Driven Workflow Implementation

## 1. Executive Summary
This document outlines the plan to transition the Product Research workflow from a synchronous, monolithic function call to an asynchronous, **Event-Driven Architecture (EDA)**. This aligns with the "Product Research Agent Pseudocode" (Doc 2) and enables better observability, decoupling, and state recovery.

## 2. Core Objectives
1.  **Decoupling**: The `SimulationService` should not "wait" for the Agent. It should trigger a request and listen for updates.
2.  **Granular Observability**: Every step of the research process (Intake, Signal Collection, Scoring) should emit a distinct event.
3.  **Resilience**: If the process crashes mid-way, the state is preserved in the event log, allowing for recovery (future state).

---

## 3. Event Taxonomy

We will adopt the `Domain.Action` naming convention defined in the documentation.

### 3.1 Research Lifecycle Events
| Event Name | Trigger | Payload Data |
| :--- | :--- | :--- |
| `OpportunityResearch.Requested` | User/System asks for research | `request_id`, `niche`, `constraints` |
| `OpportunityResearch.BriefCreated` | Agent parses request & creates shell | `brief_id`, `initial_scope` |
| `OpportunityResearch.SignalsCollected` | Agent finishes MCP scans | `brief_id`, `signal_count`, `sources` |
| `OpportunityResearch.ThemesGenerated` | Agent clusters signals into themes | `brief_id`, `themes[]` |
| `OpportunityResearch.ShortlistRanked` | Agent scores and ranks items | `brief_id`, `candidates[]` |
| `OpportunityResearch.BriefsPublished` | **Final Output** | `brief_id`, `opportunity_brief` (Full JSON) |
| `OpportunityResearch.Aborted` | Error or Kill Criteria met | `brief_id`, `reason`, `kill_code` |

### 3.2 Downstream Handoff Events
| Event Name | Purpose |
| :--- | :--- |
| `Supplier.FeasibilityRequested` | Ask Supplier Agent to check stock/shipping |
| `Marketing.AngleWhitespaceRequested` | Ask Marketing Agent to find ad angles |

---

## 4. Event Payload Standard

To ensure consistency, all events will follow a standard envelope structure, compatible with our existing `EventBusPort`.

```typescript
export interface DomainEvent<T = any> {
  // Header
  event_id: string;       // UUID
  correlation_id: string; // Links all events in a single research run
  timestamp: string;      // ISO Date
  
  // Routing
  topic: string;          // e.g., 'OpportunityResearch'
  type: string;           // e.g., 'SignalsCollected'
  source: string;         // e.g., 'ProductResearchAgent'
  
  // Body
  payload: T;
}
```

---

## 5. Implementation Plan

### Phase 1: Event Definitions
Define the event types in `src/core/domain/events/ResearchEvents.ts`.

```typescript
export const RESEARCH_EVENTS = {
  REQUESTED: 'OpportunityResearch.Requested',
  BRIEF_CREATED: 'OpportunityResearch.BriefCreated',
  SIGNALS_COLLECTED: 'OpportunityResearch.SignalsCollected',
  // ...
};
```

### Phase 2: Agent Refactoring (`ProductResearchAgent.ts`)
Break the monolithic `findWinningProducts` method into smaller, event-chained handlers.

*   **Current:**
    ```typescript
    async findWinningProducts(args) {
       // Do everything...
       return products;
    }
    ```

*   **Target State:**
    ```typescript
    // 1. Handle Request
    async handleResearchRequest(event) {
       const brief = this.createBrief(event.payload);
       await this.eventBus.publish('OpportunityResearch', 'BriefCreated', brief);
       // Trigger next step immediately or let a saga manager do it
       await this.collectSignals(brief); 
    }

    // 2. Collect Signals
    async collectSignals(brief) {
       const signals = await this.mcp.scan(...);
       await this.eventBus.publish('OpportunityResearch', 'SignalsCollected', { ... });
       await this.generateThemes(brief, signals);
    }
    // ... and so on
    ```

### Phase 3: Service Update (`SimulationService.ts`)
Update the orchestrator to be reactive.

*   **Action:** Instead of `await agent.findWinningProducts()`, it will:
    1.  `await eventBus.publish('OpportunityResearch.Requested', ...)`
    2.  Subscribe to `OpportunityResearch.BriefsPublished` to handle the final result.
    3.  Subscribe to `OpportunityResearch.Aborted` to handle failures.

### Phase 4: UI Updates
Update the "Activity Log" in the UI to stream these specific events, giving the user a real-time progress bar of the research (e.g., "Collecting Signals..." -> "Ranking Candidates..." -> "Done").

---

## 6. Migration Strategy

1.  **Dual Mode**: We will add a `v2_async` flag to the `ProductResearchAgent`.
2.  **Legacy Support**: The existing `findWinningProducts` tool will remain for backward compatibility, but internally it might just subscribe to the new events and wait for completion to return the result (bridging async to sync).
3.  **Cutover**: Once the `SimulationService` is updated to handle async events, we switch the flag and deprecate the direct method call.
