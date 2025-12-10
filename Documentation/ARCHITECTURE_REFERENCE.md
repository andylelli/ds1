# Architecture Reference: YAML to Code Mapping

This document serves as the "Living Spec" for the DropShip modular architecture. It maps the configuration keys found in the YAML files to their corresponding TypeScript implementations.

## 1. Infrastructure (`infrastructure.yaml`)

| YAML Key | Type | Class Implementation | Description |
| :--- | :--- | :--- | :--- |
| `event_bus` | `postgres` | `src/core/bus/PostgresEventBus.ts` | Production-grade event bus using PostgreSQL. |

## 2. MCP Tools (`mcp.yaml`)

These tools are available to Agents. In Simulation, "Mock" versions are used.

| Tool ID | Type | Real Implementation | Mock Implementation | Description |
| :--- | :--- | :--- | :--- | :--- |
| `ai_tool` | `internal` | `src/adapters/AiAdapter.ts` | `src/adapters/mock/MockAiAdapter.ts` | LLM Provider interface. |
| `trend_tool` | `internal` | `src/adapters/TrendAdapter.ts` | `src/adapters/mock/MockTrendAdapter.ts` | Fetches market trends. |
| `competitor_tool` | `internal` | `src/adapters/CompetitorAdapter.ts` | `src/adapters/mock/MockCompetitorAdapter.ts` | Analyzes competitor data. |
| `supplier_tool` | `internal` | `src/adapters/SupplierAdapter.ts` | `src/adapters/mock/MockSupplierAdapter.ts` | Manages supplier relationships. |
| `shop_tool` | `internal` | `src/adapters/ShopifyAdapter.ts` | `src/adapters/mock/MockShopifyAdapter.ts` | E-commerce platform (Shopify). |
| `ads_tool` | `internal` | `src/adapters/AdsAdapter.ts` | `src/adapters/mock/MockAdsAdapter.ts` | Ad network management (Meta/Google). |
| `email_tool` | `internal` | `src/adapters/EmailAdapter.ts` | `src/adapters/mock/MockEmailAdapter.ts` | Customer support & email. |
| `shipping_tool` | `internal` | `src/adapters/ShippingAdapter.ts` | `src/adapters/mock/MockShippingAdapter.ts` | Logistics and fulfillment. |
| `filesystem_tool` | `stdio` | `McpClient` (Generic) | N/A | External MCP server (e.g., filesystem). |

## 3. Agents (`agents.yaml`)

| Agent ID | Class Implementation | Role |
| :--- | :--- | :--- |
| `ceo_agent` | `src/agents/CEOAgent.ts` | **Orchestrator**: High-level strategy and delegation. |
| `research_agent` | `src/agents/ResearchAgent.ts` | **Product**: Finds winning products. |
| `supplier_agent` | `src/agents/SupplierAgent.ts` | **Sourcing**: Negotiates with suppliers. |
| `store_agent` | `src/agents/StoreAgent.ts` | **Merchandising**: Manages product listings. |
| `marketing_agent` | `src/agents/MarketingAgent.ts` | **Growth**: Runs ad campaigns. |
| `support_agent` | `src/agents/SupportAgent.ts` | **CX**: Handles customer inquiries. |
| `ops_agent` | `src/agents/OperationsAgent.ts` | **Logistics**: Fulfills orders. |
| `analytics_agent` | `src/agents/AnalyticsAgent.ts` | **Data**: Analyzes performance. |

## 4. Drivers (Entry Points)

| Mode | Component | Implementation | Purpose |
| :--- | :--- | :--- | :--- |
| **Live** | `WebhookIngress` | `src/drivers/WebhookIngress.ts` | Receives HTTP webhooks (Shopify, Meta) and emits events. |
| **Sim** | `SimulationOrchestrator` | `src/drivers/SimulationOrchestrator.ts` | Injects synthetic events based on `scenario.yaml`. |

## 5. Core Components

| Component | Path | Purpose |
| :--- | :--- | :--- |
| **Bootstrapper** | `src/core/bootstrap/Bootstrapper.ts` | Entry point. Loads YAML and boots the container. |
| **YamlLoader** | `src/core/bootstrap/YamlLoader.ts` | Parses and merges configuration files. |
| **Container** | `src/core/bootstrap/Container.ts` | Dependency Injection container. |
| **WorkflowManager** | `src/core/workflow/WorkflowManager.ts` | Reads `workflows.yaml` and registers event subscriptions. |

## 6. Configuration Interfaces

The YAML files map to these TypeScript interfaces:

```typescript
interface BootstrapConfig {
  mode: 'live' | 'simulation';
  log_level: 'debug' | 'info' | 'warn' | 'error';
  paths: {
    infrastructure: string;
    mcp: string;
    agents: string;
    workflows: string;
  };
}

interface InfrastructureConfig {
  event_bus: {
    type: 'postgres';
    connection_string?: string;
  };
  server: {
    port: number;
  };
}

interface McpConfig {
  mcp_servers: Array<{
    id: string;
    type: 'internal' | 'stdio' | 'sse';
    class?: string; // For internal
    command?: string; // For stdio
    args?: string[]; // For stdio
    config?: Record<string, any>;
  }>;
}

interface AgentsConfig {
  agents: Array<{
    id: string;
    class: string;
    model: string;
    system_prompt: string;
    tools: string[]; // List of Tool IDs
  }>;
}

interface WorkflowsConfig {
  subscriptions: Array<{
    event: string;
    subscriber: string; // Agent ID
    action: string; // Method name or instruction
  }>;
}
```
