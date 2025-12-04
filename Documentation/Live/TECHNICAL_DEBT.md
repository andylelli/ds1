# 🧹 Technical Debt & Refactoring Plan
**Project:** DropShip AI Agent Swarm (DS1)  
**Last Updated:** December 4, 2025

This document tracks architectural shortcuts, "hacks," and limitations that were accepted for speed but must be addressed for the system to scale.

## 🏗️ Architectural Debt

### 1. The "Linear Script" Trap
*   **Severity:** 🔥 High
*   **Description:** `simulation.js` runs as a strict, synchronous sequence (`Research -> Source -> Build -> Market`).
*   **The Problem:** Real business is asynchronous. If `Operations` is fulfilling an order, `Marketing` should still be optimizing ads. Currently, agents block each other.
*   **Proposed Solution:** Move to an **Event-Driven Architecture**.
    *   Introduce an `EventBus` (e.g., Node `EventEmitter` or Redis).
    *   Agents subscribe to events (e.g., `ON_ORDER_RECEIVED`, `ON_HOUR_TICK`).
    *   The main loop becomes a "Tick" generator rather than a script runner.

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

## 🧹 Code Quality & Maintenance

### 4. Hardcoded Configuration
*   **Severity:** 🔹 Low
*   **Description:** Some simulation parameters (e.g., "Smart Home" category, Ad Budgets) are hardcoded in `simulation.js`.
*   **Proposed Solution:** Move all simulation parameters to `config.json` or a `SimulationProfile` object so we can run different scenarios without changing code.

### 5. Logging Granularity
*   **Severity:** 🔹 Low
*   **Description:** `saveAgentLog` saves everything to one big list.
*   **Proposed Solution:** Implement structured logging (JSON lines) and log rotation. Separate "Audit Logs" (decisions made) from "Debug Logs" (API responses).
