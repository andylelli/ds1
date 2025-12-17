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
| `ai_tool` | `internal` | `src/infra/ai/LiveAiAdapter.ts` | `src/infra/ai/MockAiAdapter.ts` | LLM Provider interface. |
| `trend_tool` | `internal` | `src/infra/trends/LiveTrendAdapter.ts` | `src/infra/trends/MockTrendAdapter.ts` | Fetches market trends. |
| `competitor_tool` | `internal` | `src/infra/competitor/LiveCompetitorAdapter.ts` | `src/infra/competitor/MockCompetitorAdapter.ts` | Analyzes competitor data. |
| `supplier_tool` | `internal` | `src/infra/supplier/LiveSupplierAdapter.ts` | `src/infra/supplier/MockSupplierAdapter.ts` | Manages supplier relationships. |
| `shop_tool` | `internal` | `src/infra/shop/LiveShopAdapter.ts` | `src/infra/shop/MockShopifyAdapter.ts` | E-commerce platform (Shopify). |
| `ads_tool` | `internal` | `src/infra/ads/LiveAdsAdapter.ts` | `src/infra/ads/MockAdsAdapter.ts` | Ad network management (Meta/Google). |
| `email_tool` | `internal` | `src/infra/email/LiveEmailAdapter.ts` | `src/infra/email/MockEmailAdapter.ts` | Customer support & email. |
| `shipping_tool` | `internal` | `src/infra/fulfillment/LiveFulfilmentAdapter.ts` | `src/infra/fulfillment/MockFulfilmentAdapter.ts` | Logistics and fulfillment. |
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
| **MCP** | `McpServer` | `src/mcp-server.ts` | Exposes internal adapters as MCP tools over stdio. |

## 5. Core Components

| Component | Path | Purpose |
| :--- | :--- | :--- |
| **Container** | `src/core/bootstrap/Container.ts` | Main entry point. Loads config and wires dependencies. |
| **ServiceFactory** | `src/core/bootstrap/ServiceFactory.ts` | Instantiates Adapters and Agents based on config. |
| **YamlLoader** | `src/core/bootstrap/YamlLoader.ts` | Parses and merges configuration files. |
| **WorkflowManager** | `src/core/workflow/WorkflowManager.ts` | Reads `workflows.yaml` and registers event subscriptions. |
| **McpToolProvider** | `src/core/mcp/McpToolProvider.ts` | Interface for adapters to expose MCP tools. |

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

## 7. Adapter Strategies (Live Mode)

### Google Trends (Strict Mode)
- **Strategy**: Active Exploration (Seed -> Related Queries -> Interest Over Time).
- **Constraint**: No AI simulation or "hallucination" of data.
- **Failure Handling**: Throws `TrendAnalysisError` on API failure (429/404).
- **Reference**: See `Documentation/PMO/GOOGLE_TRENDS_INTEGRATION_STRATEGY.md` for full API details.
