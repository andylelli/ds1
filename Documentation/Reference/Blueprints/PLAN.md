# 📐 Blueprints & Architecture Roadmap

## 🎯 Objective
This folder contains the "Deep Think" architectural documents that guide the evolution of the DropShip AI system. While the **Agents** folder documents *who* does the work, this folder documents *how* the complex systems underneath them function.

## 📂 Document Structure

### 🏗️ Core Infrastructure (The Foundation)
*   [x] **`01_EVENT_BUS.md`** (Updated)
    *   *Topic:* The asynchronous nervous system (`PostgresEventStore`).
    *   *Status:* **Implemented**. The system now uses a Postgres-backed event bus for reliable communication.
*   [x] **`02_MULTI_PRODUCT.md`** (Updated)
    *   *Topic:* Scaling from 1 product to a full catalog.
    *   *Status:* **Designed**. Schema and Lifecycle defined.

### 🧠 Intelligence Systems (The Brains)
*   [x] **`03_ANALYTICS_PIPELINE.md`** (Updated)
    *   *Topic:* The `FinancialLedger` and "Source of Truth" for profit.
    *   *Status:* **Designed**. Ledger schema defined.
*   [x] **`04_STRATEGY_ENGINE.md`** (Updated)
    *   *Topic:* The CEO's OODA loop (Observe, Orient, Decide, Act).
    *   *Status:* **Designed**. Strategy modes defined.
*   [x] **`05_CS_CONTEXT.md`** (Updated)
    *   *Topic:* Context-aware customer support (Ticket History).
    *   *Status:* **Designed**. Ticket schema and Context Window logic defined.

### 🚀 Expansion Modules (New Capabilities)
*   [x] **`06_RETENTION_SYSTEM.md`** (Updated)
    *   *Topic:* Email/SMS marketing flows (LTV maximization).
    *   *Status:* **Designed**. Customer State Machine defined.
*   [x] **`07_COMPLIANCE_SYSTEM.md`** (Updated)
    *   *Topic:* Risk management and policy checking.
    *   *Status:* **Designed**. Middleware architecture defined.

## 📅 Phased Update Plan

### Phase 1: Core Architecture (The Foundation)
*   [x] **`01_EVENT_BUS.md`**
    *   *Action:* Updated to reflect `PostgresEventStore`.
*   [x] **`02_MULTI_PRODUCT.md`**
    *   *Action:* Redesigned for Postgres Schema (`products` table) and Product Lifecycle State Machine.

### Phase 2: Intelligence Layer (The Brain)
*   [x] **`03_ANALYTICS_PIPELINE.md`**
    *   *Action:* Designed the `ledger` table and CFO role for `AnalyticsAgent`.
*   [x] **`04_STRATEGY_ENGINE.md`**
    *   *Action:* Defined the CEO's OODA Loop and Strategic Modes (Discovery, Scaling, Defense).

### Phase 3: Advanced Capabilities (The Expansion)
*   [x] **`05_CS_CONTEXT.md`**
    *   *Action:* Defined `tickets` schema and Context Window logic for `CustomerServiceAgent`.
*   [x] **`06_RETENTION_SYSTEM.md`**
    *   *Action:* Defined Customer Lifecycle State Machine and `RetentionAgent` logic.
*   [x] **`07_COMPLIANCE_SYSTEM.md`**
    *   *Action:* Defined Compliance Middleware and `audit_log` schema.
