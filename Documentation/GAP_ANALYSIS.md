# Gap Analysis: Current vs. Target Architecture

This document outlines the specific code changes required to move from the current "Monolithic/RPC" architecture to the "YAML-Driven, Event-Based" target state.

## 1. Modular Bootstrapping (The "YAML Loader")

**Current State:**
*   src/index.ts hardcodes the instantiation of every Adapter and Agent.
*   Configuration is scattered between .env, ConfigService, and hardcoded logic.
*   Switching between "Simulation" and "Live" requires code changes or complex if/else blocks in index.ts.

**Target State:**
*   A **Bootstrapper** reads gent_config.yaml and ootstrap.yaml.
*   It dynamically instantiates Adapters and Agents based on the configuration.
*   index.ts becomes a thin entry point that simply calls Bootstrapper.boot().

**Required Changes:**
1.  **Create src/core/bootstrap/YamlLoader.ts:** Logic to parse the YAML files.
2.  **Create src/core/bootstrap/Container.ts:** A Dependency Injection container (or simple registry) to hold the instantiated Agents and Adapters.
3.  **Refactor index.ts:** Replace manual instantiation with the Bootstrapper.

## 2. Event Bus Integration

**Current State:**
*   PostgresEventStore exists but is unused.
*   Agents communicate via direct method calls (RPC).

**Target State:**
*   The Event Bus is the central nervous system.
*   event_bus.yaml defines the topics and subscriptions.

**Required Changes:**
1.  **Instantiate Event Bus:** The Bootstrapper should initialize PostgresEventStore (or Redis for live).
2.  **Inject into Agents:** Update BaseAgent to accept EventBusPort.
3.  **Refactor Communication:**
    *   **CEO Agent:** Emit RESEARCH_REQUESTED instead of calling esearch.findWinningProducts().
    *   **Research Agent:** Subscribe to RESEARCH_REQUESTED (defined in YAML).
    *   **CEO Agent:** Subscribe to RESEARCH_COMPLETED.

## 3. Webhook Ingress (Live Mode Driver)

**Current State:**
*   System is driven solely by SimulationService or manual API calls.

**Target State:**
*   Live mode is "Reactive". External events (Webhooks) trigger internal workflows.

**Required Changes:**
1.  **Create src/api/webhook-routes.ts:** Endpoints for Shopify, Meta, etc.
2.  **Event Emission:** Webhook handlers simply validate the payload and emit an event (e.g., ORDER_PAID) to the Event Bus.
3.  **Agent Reaction:** Agents subscribe to these events to perform their tasks.

## 4. Simulation Service (Simulation Mode Driver)

**Current State:**
*   SimulationService is a procedural script that manually steps through the workflow.

**Target State:**
*   SimulationService is just **one of many possible drivers**.
*   It is used **only** for Simulation mode.
*   It functions as a "Scenario Injector" that emits a sequence of events to test how Agents react.

**Required Changes:**
*   **Decouple from Agents:** SimulationService should not hold references to specific Agent instances. It should emit events to the Bus.
*   **Scenario Config:** Allow loading different simulation scenarios (e.g., "High Traffic", "Supply Chain Failure") via YAML.

## 5. MCP Tool Protocol

**Current State:**
*   Adapters are injected directly into Agents.
*   Tool usage is informal.

**Target State:**
*   Agents interact with the outside world via **MCP Tool Calls**.
*   gent_config.yaml defines which Tools are available to which Agent.

**Required Changes:**
1.  **Formalize Tool Definitions:** Ensure Adapters expose formal MCP Tool definitions.
2.  **Standardize Execution:** Agents use 	his.callTool() to invoke Adapters.

## Summary of Work

| Area | Task | Complexity |
| :--- | :--- | :--- |
| **Bootstrap** | Create YAML Loader & DI Container | High |
| **Event Bus** | Wire up Event Bus & Refactor Agents to use Events | High |
| **Webhooks** | Create Webhook Ingress routes | Medium |
| **MCP** | Standardize Adapter calls to MCP Tool pattern | Medium |
| **Simulation** | Refactor SimulationService to be event-driven | Medium |
