# Gap Analysis: Modular, YAML-Driven Architecture

This document outlines the transition from the current hardcoded/monolithic state to a fully modular, configuration-driven system.

## 1. The YAML Configuration Strategy

To answer "what can be spun up from YAML", the goal is **everything**. The code should be a generic engine; the YAML defines the specific application instance (Live vs. Sim, E-com vs. SaaS, etc.).

We propose a **5-File Configuration Structure** to separate concerns:

| File | Purpose | What it Controls |
| :--- | :--- | :--- |
| **1. ootstrap.yaml** | **Entry Point** | Environment mode (Live/Sim), Log levels, paths to other config files. |
| **2. infrastructure.yaml** | **Plumbing** | **Event Bus provider** (Redis/Postgres/Memory), Database connections, Server ports. |
| **3. mcp.yaml** | **Tools/IO** | **MCP Servers** (Stdio/SSE) and **Internal Adapters**. Defines *capabilities*. |
| **4. gents.yaml** | **Workers** | Which Agents to spawn, their System Prompts, Model settings, and assigned Tools (MCP Servers). |
| **5. workflows.yaml** | **Wiring** | Event Subscriptions. Who listens to what? (e.g., OrderPaid -> FulfillmentAgent). |

---

## 2. Detailed Gap Analysis

### A. Modular Bootstrapping (The Core Engine)

**Current State:**
*   src/index.ts manually imports and 
ews every class.
*   Changing the "Event Bus" or "Shopify Adapter" requires rewriting code.

**Target State:**
*   src/index.ts is minimal:
    `	ypescript
    const config = YamlLoader.load('bootstrap.yaml');
    const container = new Container(config);
    container.boot();
    `
*   The **Container** uses Reflection or a Factory pattern to instantiate classes defined in YAML strings.

**Required Changes:**
1.  **YamlLoader**: A utility to read and merge the 5 YAML files.
2.  **ServiceFactory**: A class that takes a string name (e.g., "ShopifyAdapter") and returns an instance.
3.  **DependencyContainer**: Holds the singletons (Bus, Adapters) and injects them into Agents.

### B. Infrastructure & Event Bus (YAML-Driven)

**Current State:**
*   Event Bus is either missing or hardcoded.

**Target State:**
*   The Event Bus is an interchangeable infrastructure component.
*   **infrastructure.yaml** example:
    `yaml
    event_bus:
      type: "postgres" # or "redis", "memory"
      connection: ""
      retention_days: 7
    `

**Required Changes:**
1.  **Interface IEventBus**: Standardize publish() and subscribe().
2.  **Implementations**: Ensure PostgresEventBus, RedisEventBus, and MemoryEventBus all implement IEventBus.
3.  **Factory Logic**: The Bootstrapper reads 	ype: "postgres" and instantiates PostgresEventBus.

### C. MCP & Tools (YAML-Driven)

**Current State:**
*   Adapters are injected directly into Agents.
*   Tool usage is informal.

**Target State:**
*   **mcp.yaml** defines all available tools (both internal classes and external MCP servers):
    `yaml
    mcp_servers:
      - id: "shopify_tool"
        type: "internal"
        class: "ShopifyAdapter"
        config: { shop_url: "" }
      - id: "filesystem_tool"
        type: "stdio"
        command: "npx"
        args: ["-y", "@modelcontextprotocol/server-filesystem", "./data"]
    `
*   **gents.yaml** assigns these tools to agents:
    `yaml
    agents:
      - id: "ceo_agent"
        tools: ["shopify_tool", "filesystem_tool"]
    `

**Required Changes:**
1.  **MCP Client Integration**: The Bootstrapper must be able to start stdio processes for external MCP servers.
2.  **Internal Adapter Wrapper**: Wrap internal classes (like ShopifyAdapter) so they look like MCP servers to the Agents.

### D. Workflow Wiring (The Nervous System)

**Current State:**
*   Logic flow is hardcoded: ceo.doWork() calls esearch.doWork().

**Target State:**
*   Logic flow is defined in **workflows.yaml** (or subscriptions section):
    `yaml
    subscriptions:
      - event: "RESEARCH_REQUESTED"
        subscriber: "research_agent"
        action: "find_products"
      - event: "RESEARCH_COMPLETED"
        subscriber: "ceo_agent"
        action: "review_results"
    `

**Required Changes:**
1.  **Subscription Manager**: The Bootstrapper iterates through this list and registers the subscriptions on the Event Bus.
2.  **Standardized Event Handlers**: Agents must have a standard way to receive events (e.g., handleEvent(event)).

### E. Simulation vs. Live Mode

**Current State:**
*   SimulationService drives the app procedurally.

**Target State:**
*   **Live Mode**: infrastructure.yaml enables WebhookIngress. External webhooks fire events onto the bus.
*   **Sim Mode**: infrastructure.yaml enables SimulationDriver. It reads a scenario.yaml and fires synthetic events onto the bus.

**Required Changes:**
1.  **SimulationDriver**: A special "Agent" that just emits events based on a timeline.
2.  **WebhookIngress**: An Express server that maps HTTP POSTs to Event Bus events.

---

## 3. Implementation Roadmap

1.  **Phase 1: The Skeleton**
    *   Create the 5 YAML files (empty/skeleton).
    *   Build YamlLoader and ServiceFactory.
    *   Refactor index.ts to load ootstrap.yaml.

2.  **Phase 2: The Nervous System**
    *   Implement MemoryEventBus (for dev) and PostgresEventBus.
    *   Wire up infrastructure.yaml to load the correct bus.

3.  **Phase 3: The Body (MCP Integration)**
    *   Implement McpClient to handle both "internal" and "stdio" servers.
    *   Refactor ShopifyAdapter to be an internal MCP tool.
    *   Update gents.yaml to assign tools.

4.  **Phase 4: The Brain**
    *   Implement workflows.yaml parsing.
    *   Replace direct method calls in Agents with Event Bus usage.
