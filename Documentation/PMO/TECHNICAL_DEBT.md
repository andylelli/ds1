# 🧹 Technical Debt & Refactoring Plan
**Project:** DropShip AI Agent Swarm (DS1)  
**Last Updated:** December 5, 2025

This document tracks architectural shortcuts, "hacks," and limitations that were accepted for speed but must be addressed for the system to scale.

## 🏗️ Architectural Debt

### 1. The "Linear Script" Trap
*   **Severity:** 🔥 Critical (Blocker for Live Mode)
*   **Description:** `simulation.js` runs as a strict, synchronous sequence (`Research -> Source -> Build -> Market`).
*   **The Problem:**
    *   **Simulation:** It works fine for a "Turn-Based" game.
    *   **Live System:** Real business is **Real-Time**. A Shopify Webhook (`orders/create`) cannot wait for the "Research Phase" to finish. It must be handled immediately.
*   **Proposed Solution:** Move to an **Event-Driven Architecture**.
    *   Introduce an `EventBus` (e.g., Node `EventEmitter` for local, Redis for distributed).
    *   **Live Workflow:**
        1.  Shopify Webhook -> Pushes `EVENT_ORDER_PAID` to Bus.
        2.  `OperationsAgent` (listening) -> Wakes up, fulfills order.
        3.  `AnalyticsAgent` (listening) -> Wakes up, logs revenue.
    *   This allows agents to sleep until needed, saving compute/API costs.

### 2. JSON Database Scalability (Partially Addressed)
*   **Severity:** 🔸 Medium
*   **Description:** We use `sandbox_db.json` for simulation persistence.
*   **Status:** 🚧 **In Progress**. We have implemented the `PersistencePort` and `PostgresAdapter`, allowing us to switch to Postgres.
*   **Remaining Debt:**
    *   **Schema Management:** We currently rely on manual table creation or raw SQL in the adapter. We need a proper migration tool (Knex/TypeORM) to manage schema changes safely.
    *   **Mock Parity:** The `MockAdapter` (JSON) and `PostgresAdapter` (SQL) might drift apart if we don't enforce strict interface compliance tests.

### 3. "Happy Path" Error Handling
*   **Severity:** 🔸 Medium
*   **Description:** Agents assume external calls succeed.
*   **The Problem:** If the `ProductResearcher` returns `undefined` (due to an API error), the simulation crashes or uses hardcoded fallbacks that mask the issue.
*   **Proposed Solution:** Implement a **Retry & Circuit Breaker** pattern.
    *   If a task fails, retry 3 times with exponential backoff.
    *   If it still fails, log a "Critical Alert" and pause that specific agent, not the whole system.

### 4. Zero Unit Test Coverage
*   **Severity:** 🔥 High
*   **Description:** The project relies entirely on manual "end-to-end" testing via `run_simulation_cli.js`.
*   **The Problem:** Refactoring core logic (like the `TrafficSimulator`) is risky because we have no automated way to verify that edge cases (e.g., 0 visitors) are handled correctly.
*   **Proposed Solution:** Introduce **Jest** or **Mocha**.
    *   Write unit tests for `trafficSimulator.js` and `marketEvents.js` immediately.
    *   Mock the `BaseAgent` class to test individual agent logic in isolation.

### 5. Agent Context Window Management
*   **Severity:** 🔸 Medium
*   **Description:** Agents currently have no memory of past interactions.
*   **The Problem:** The `CustomerServiceAgent` cannot handle multi-turn conversations. It treats every message as a new request.
*   **Proposed Solution:** Implement a **Context-Aware Ticketing System**.
    *   See `Documentation/Blueprints/DESIGN_CS_CONTEXT.md` for the full design.
    *   Store conversation history in a structured DB.
    *   Inject history into the Agent's prompt before generation.

### 6. Hardcoded Configuration
*   **Severity:** 🔹 Low
*   **Description:** API keys and settings are often hardcoded or scattered.
*   **The Problem:** Changing a setting requires code edits.
*   **Proposed Solution:** Centralize all config in `src/config/settings.js` (or `.env`).
*   **Severity:** 🔥 High
*   **Description:** Agents currently have no mechanism to "forget" or summarize past actions.
*   **The Problem:** As the simulation runs for "days" or "weeks", the conversation history sent to OpenAI will exceed the token limit (e.g., 128k tokens), causing crashes or massive API bills.
*   **Proposed Solution:** Implement a **Rolling Context Window**.
    *   Keep only the last N messages in immediate context.
    *   Summarize older messages into a "Long Term Memory" string stored in the DB.

## 🧹 Code Quality & Maintenance

### 7. Logging Granularity
*   **Severity:** 🔹 Low
*   **Description:** `saveAgentLog` saves everything to one big list.
*   **Proposed Solution:** Implement structured logging (JSON lines) and log rotation. Separate "Audit Logs" (decisions made) from "Debug Logs" (API responses).

### 8. Frontend Polling (Admin Panel)
*   **Severity:** 🔹 Low
*   **Description:** The `admin.html` dashboard likely uses `setInterval` to fetch logs every few seconds.
*   **The Problem:** This creates unnecessary server load and latency.
*   **Proposed Solution:** Switch to **WebSockets** (Socket.io) for real-time log streaming from the server to the browser.

### 9. Type Safety (TypeScript)
*   **Severity:** 🔸 Medium
*   **Description:** The codebase is a mix of JS and TS.
*   **The Problem:** `any` types are used frequently in the new Adapters to bypass strict checks.
*   **Proposed Solution:** Enable `noImplicitAny` in `tsconfig.json` and properly type all DTOs (Data Transfer Objects) between the Frontend and Backend.
