# 📐 Blueprints & Architecture Roadmap

## 🎯 Objective
This folder contains the "Deep Think" architectural documents that guide the evolution of the DropShip AI system. While the **Agents** folder documents *who* does the work, this folder documents *how* the complex systems underneath them function.

## 📂 Document Structure

### 🏗️ Core Infrastructure (The Foundation)
*   [x] **`01_EVENT_BUS.md`** (Updated)
    *   *Topic:* The asynchronous nervous system (`PostgresEventStore`).
    *   *Status:* **Implemented**. The system now uses a Postgres-backed event bus for reliable communication.
*   [ ] **`02_MULTI_PRODUCT.md`**
    *   *Topic:* Scaling from 1 product to a full catalog.
    *   *Status:* **Draft**. Needs implementation in `PersistencePort`.

### 🧠 Intelligence Systems (The Brains)
*   [ ] **`03_ANALYTICS_PIPELINE.md`**
    *   *Topic:* The `FinancialLedger` and "Source of Truth" for profit.
    *   *Status:* **Draft**. `AnalyticsAgent` is currently mock.
*   [ ] **`04_STRATEGY_ENGINE.md`**
    *   *Topic:* The CEO's OODA loop (Observe, Orient, Decide, Act).
    *   *Status:* **Draft**. CEO has basic logic but needs this engine for autonomy.
*   [ ] **`05_CS_CONTEXT.md`**
    *   *Topic:* Context-aware customer support (Ticket History).
    *   *Status:* **Draft**. `CustomerServiceAgent` is stateless.

### 🚀 Expansion Modules (New Capabilities)
*   [ ] **`06_RETENTION_SYSTEM.md`**
    *   *Topic:* Email/SMS marketing flows (LTV maximization).
    *   *Status:* **Planned**.
*   [ ] **`07_COMPLIANCE_SYSTEM.md`**
    *   *Topic:* Risk management and policy checking.
    *   *Status:* **Planned**.

## 🛠️ Action Items
1.  **Update `01_EVENT_BUS.md`** to reflect the actual `PostgresEventStore` implementation (replacing the old "Redis vs Local" debate).
2.  **Rename** existing files to match the numbered structure.
3.  **Implement** `02_MULTI_PRODUCT.md` as the next major architectural upgrade.
