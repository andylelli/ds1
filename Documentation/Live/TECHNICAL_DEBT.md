# 🧹 Technical Debt & Refactoring Plan
**Project:** DropShip AI Agent Swarm (DS1)  
**Last Updated:** December 4, 2025

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

### 2. JSON Database Scalability
*   **Severity:** 🔸 Medium
*   **Description:** We use `sandbox_db.json` and `fs.writeFileSync` for persistence.
*   **The Problem:**
    *   **Performance:** Reading/writing the whole file for every log entry is slow (O(n)).
    *   **Concurrency:** Race conditions will occur if we move to async agents.
    *   **Querying:** We cannot easily query "Orders from last Tuesday" without loading everything.
*   **Proposed Solution:** Abstract the DB layer to support **SQLite** (local) or **MongoDB** (cloud).
    *   Create a `DatabaseInterface` class.
    *   Swap the backend implementation without changing agent code.

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
*   **Severity:** 🔥 High
*   **Description:** Agents currently have no mechanism to "forget" or summarize past actions.
*   **The Problem:** As the simulation runs for "days" or "weeks", the conversation history sent to OpenAI will exceed the token limit (e.g., 128k tokens), causing crashes or massive API bills.
*   **Proposed Solution:** Implement a **Rolling Context Window**.
    *   Keep only the last N messages in immediate context.
    *   Summarize older messages into a "Long Term Memory" string stored in the DB.

## 🧹 Code Quality & Maintenance

### 6. Hardcoded Configuration
*   **Severity:** 🔹 Low
*   **Description:** Some simulation parameters (e.g., "Smart Home" category, Ad Budgets) are hardcoded in `simulation.js`.
*   **Proposed Solution:** Move all simulation parameters to `config.json` or a `SimulationProfile` object so we can run different scenarios without changing code.

### 7. Logging Granularity
*   **Severity:** 🔹 Low
*   **Description:** `saveAgentLog` saves everything to one big list.
*   **Proposed Solution:** Implement structured logging (JSON lines) and log rotation. Separate "Audit Logs" (decisions made) from "Debug Logs" (API responses).

### 8. Frontend Polling (Admin Panel)
*   **Severity:** 🔹 Low
*   **Description:** The `admin.html` dashboard likely uses `setInterval` to fetch logs every few seconds.
*   **The Problem:** This creates unnecessary server load and latency.
*   **Proposed Solution:** Switch to **WebSockets** (Socket.io) for real-time log streaming from the server to the browser.
