# 🏛️ Decision Log (ADR)

**Project:** DropShip AI Agent Swarm (DS1)
**Purpose:** To record significant architectural and strategic decisions, the context behind them, and the consequences.

## 📋 Log

| ID | Date | Decision | Status | Context & Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **ADR-001** | 2025-12-01 | **Hybrid Mock/Real Architecture** | ✅ Accepted | **Context:** We need to develop safely without spending real money, but switch to live APIs instantly.<br>**Decision:** Implement a `useSimulatedEndpoints` flag in `config.js`. Agents use Interface pattern to swap logic.<br>**Consequence:** Double implementation effort (Mock + Real) but zero risk during dev. |
| **ADR-002** | 2025-12-03 | **Event-Driven Architecture** | 🚧 In Progress | **Context:** The linear `simulation.js` loop blocks real-time webhooks (Shopify).<br>**Decision:** Move to an Event Bus (Node EventEmitter / Redis).<br>**Consequence:** Requires refactoring all agents to be "Listeners" rather than "Functions". |
| **ADR-003** | 2025-12-04 | **Context-Aware CS System** | 🚧 In Progress | **Context:** CS Agent was stateless and forgot conversation history.<br>**Decision:** Implement a `Ticket` DB and inject history into the prompt.<br>**Consequence:** Higher token usage per request, but necessary for human-like support. |
| **ADR-004** | 2025-12-04 | **PMO Folder Structure** | ✅ Accepted | **Context:** Documentation was mixed. Hard to distinguish "Active Tasks" from "Static Guides".<br>**Decision:** Split into `PMO` (Active), `Blueprints` (Design), and `Reference` (Static). |
