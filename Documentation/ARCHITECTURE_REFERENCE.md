# Architecture Reference: YAML to Code Mapping

This document serves as the "Living Spec" for the DropShip modular architecture. It maps the configuration keys found in the YAML files to their corresponding TypeScript implementations.

## 1. Infrastructure (`infrastructure.yaml`)

| YAML Key | Type | Class Implementation | Description |
| :--- | :--- | :--- | :--- |
| `event_bus` | `postgres` | `src/core/bus/PostgresEventBus.ts` | Production-grade event bus using PostgreSQL. |
| `event_bus` | `memory` | `src/core/bus/MemoryEventBus.ts` | In-memory event bus for testing/dev. |

## 2. MCP Tools (`mcp.yaml`)

| YAML Key | Type | Class Implementation | Description |
| :--- | :--- | :--- | :--- |
| `shopify_tool` | `internal` | `src/adapters/ShopifyAdapter.ts` | Real Shopify API wrapper. |
| `shopify_tool` | `mock` | `src/adapters/mock/MockShopifyAdapter.ts` | Generative mock for simulation. |
| `filesystem_tool` | `stdio` | `McpClient` (Generic) | External MCP server running via stdio. |

## 3. Agents (`agents.yaml`)

| YAML Key | Class Implementation | Description |
| :--- | :--- | :--- |
| `CEOAgent` | `src/agents/CEOAgent.ts` | The orchestrator agent. |
| `ResearchAgent` | `src/agents/ResearchAgent.ts` | Product research specialist. |

## 4. Core Components

| Component | Path | Purpose |
| :--- | :--- | :--- |
| **Bootstrapper** | `src/core/bootstrap/Bootstrapper.ts` | Entry point. Loads YAML and boots the container. |
| **YamlLoader** | `src/core/bootstrap/YamlLoader.ts` | Parses and merges configuration files. |
| **Container** | `src/core/bootstrap/Container.ts` | Dependency Injection container. |
