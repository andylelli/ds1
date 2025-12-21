# Architecture Reference

This document serves as the source of truth for the mapping between the YAML configuration files and the actual TypeScript classes in the codebase.

## 1. System Overview

The system follows a Hexagonal Architecture (Ports & Adapters) pattern, orchestrated by a central `Container` or `ServiceFactory` (located in `src/core/bootstrap/`).

### Architecture Diagram

High-level data flow showing the interaction between the Core Agents and the External World via Adapters:

```mermaid
graph LR
    subgraph Entry ["3. Entry Points"]
        direction TB
        API[API Layer]
        CLI[CLI Scripts]
        Config[YAML Config]
    end

    subgraph Glue ["4. The Glue"]
        Factory[ServiceFactory]
    end

    subgraph Core ["1. The Core"]
        direction TB
        Services[Domain Services]
        Agents[AI Agents]
        Ports{Port Interfaces}
    end

    subgraph Infra ["2. Infrastructure"]
        direction TB
        Persistence[Persistence Adapter]
        EventBus[Event Bus]
        Integrations[External Integrations]
    end

    subgraph World ["External World"]
        direction TB
        DB[(Database)]
        APIs[3rd Party APIs]
    end

    %% Configuration & Bootstrap
    Config --> Factory
    Factory -.->|Injects Adapters| Agents
    
    %% Execution Flow
    API --> Services
    CLI --> Services
    Services -->|Orchestrates| Agents
    Agents -->|Call| Ports
    
    %% Implementation
    Persistence -.->|Implements| Ports
    EventBus -.->|Implements| Ports
    Integrations -.->|Implements| Ports
    
    %% External Connections
    Persistence -->|R/W| DB
    EventBus -->|Store| DB
    Integrations -->|Fetch/Push| APIs
```

### Major Components

#### 1. The Core (Domain & Application)
The heart of the application, containing business logic and interfaces.
- **AI Agents** (`src/agents/`): The autonomous workers (CEO, Analytics, Research, etc.).
- **Domain Services** (`src/core/services/`): Orchestration logic (e.g., `SimulationService`, `ResearchStagingService`).
- **Ports** (`src/core/domain/ports/`): Interfaces defining *what* the system needs without defining *how*.

#### 2. Infrastructure (Driven Adapters)
Implementations of Ports that connect the Core to the outside world.
- **Persistence**: `PostgresAdapter` (Live) / `MockAdapter` (Sim).
- **Event Bus**: `PostgresEventBus` (Async communication).
- **External Integrations**: Adapters for Shopify, Google Ads, Google Trends, OpenAI.

#### 3. Entry Points (Driving Adapters)
Triggers that start system execution.
- **API Layer** (`src/api/`): Express.js routes powering the frontend dashboard.
- **CLI Scripts** (`src/run_simulation_cli.js`): Command-line tools.
- **Configuration** (`config/`): YAML files controlling the environment (Live vs. Sim).

#### 4. The "Glue" (Bootstrap)
- **ServiceFactory** (`src/core/bootstrap/`): Handles Dependency Injection, reading config to instantiate the correct Adapters for each Agent.

## 2. Agent Mapping

Agents are defined in `config/agents.yaml` and instantiated in `src/core/bootstrap/ServiceFactory.ts`.

| Agent Role | YAML Key | Class Name | File Path |
| :--- | :--- | :--- | :--- |
| **CEO** | `ceo_agent` | `CEOAgent` | [src/agents/CEOAgent.ts](src/agents/CEOAgent.ts) |
| **Analytics** | `analytics_agent` | `AnalyticsAgent` | [src/agents/AnalyticsAgent.ts](src/agents/AnalyticsAgent.ts) |
| **Product Research** | `product_research_agent` | `ProductResearchAgent` | [src/agents/ProductResearchAgent.ts](src/agents/ProductResearchAgent.ts) |
| **Supplier** | `supplier_agent` | `SupplierAgent` | [src/agents/SupplierAgent.ts](src/agents/SupplierAgent.ts) |
| **Store Build** | `store_build_agent` | `StoreBuildAgent` | [src/agents/StoreBuildAgent.ts](src/agents/StoreBuildAgent.ts) |
| **Marketing** | `marketing_agent` | `MarketingAgent` | [src/agents/MarketingAgent.ts](src/agents/MarketingAgent.ts) |
| **Customer Service** | `customer_service_agent` | `CustomerServiceAgent` | [src/agents/CustomerServiceAgent.ts](src/agents/CustomerServiceAgent.ts) |
| **Operations** | `operations_agent` | `OperationsAgent` | [src/agents/OperationsAgent.ts](src/agents/OperationsAgent.ts) |

> **Note**: The `SimulationService` currently orchestrates a subset of these agents (CEO, Research, Supplier, Store, Marketing, Analytics).

## 3. Infrastructure Adapters (Ports & Adapters)

Adapters are selected based on `config/bootstrap.yaml` (or `bootstrap.live.yaml` / `bootstrap.sim.yaml`).

### Persistence (`PersistencePort`)
| Mode | Class Name | File Path |
| :--- | :--- | :--- |
| `mock` | `MockAdapter` | [src/infra/db/MockAdapter.ts](src/infra/db/MockAdapter.ts) |
| `postgres` | `PostgresAdapter` | [src/infra/db/PostgresAdapter.ts](src/infra/db/PostgresAdapter.ts) |

> **Note**: `PostgresAdapter` manages **two separate connection pools**: one for "Live" data and one for "Simulation" (Mock) data. This allows the system to run simulations against a real Postgres database (`dropship_sim`) without polluting the production data (`dropship`).

### Event Bus (`EventBusPort`)
| Mode | Class Name | File Path |
| :--- | :--- | :--- |
| `postgres` | `PostgresEventBus` | [src/infra/events/PostgresEventBus.ts](src/infra/events/PostgresEventBus.ts) |

> **Note**: `PostgresEventBus` uses `PersistencePort.saveEvent()` to store events in the main database (Postgres), effectively treating the main DB as the "Event Store".

### Trends Provider (`TrendAnalysisPort`)
| Mode | Class Name | File Path |
| :--- | :--- | :--- |
| `mock` | `MockTrendAdapter` | [src/infra/trends/GoogleTrendsAPI/MockTrendAdapter.ts](src/infra/trends/GoogleTrendsAPI/MockTrendAdapter.ts) |
| `live` | `LiveTrendAdapter` | [src/infra/trends/GoogleTrendsAPI/LiveTrendAdapter.ts](src/infra/trends/GoogleTrendsAPI/LiveTrendAdapter.ts) |

### Shop Platform (`ShopPlatformPort`)
| Mode | Class Name | File Path |
| :--- | :--- | :--- |
| `mock` | `MockShopAdapter` | [src/infra/shop/MockShopAdapter.ts](src/infra/shop/MockShopAdapter.ts) |
| `live` | `LiveShopAdapter` | [src/infra/shop/LiveShopAdapter.ts](src/infra/shop/LiveShopAdapter.ts) |

### Ads Platform (`AdsPlatformPort`)
| Mode | Class Name | File Path |
| :--- | :--- | :--- |
| `mock` | `MockAdsAdapter` | [src/infra/ads/GoogleAds/MockAdsAdapter.ts](src/infra/ads/GoogleAds/MockAdsAdapter.ts) |
| `live` | `LiveAdsAdapter` | [src/infra/ads/GoogleAds/LiveAdsAdapter.ts](src/infra/ads/GoogleAds/LiveAdsAdapter.ts) |

### AI Provider (`AiPort`)
| Mode | Class Name | File Path |
| :--- | :--- | :--- |
| `mock` | `MockAiAdapter` | [src/infra/ai/OpenAI/MockAiAdapter.ts](src/infra/ai/OpenAI/MockAiAdapter.ts) |
| `live` | `LiveAiAdapter` | [src/infra/ai/OpenAI/LiveAiAdapter.ts](src/infra/ai/OpenAI/LiveAiAdapter.ts) |

### Competitor Analysis (`CompetitorAnalysisPort`)
| Mode | Class Name | File Path |
| :--- | :--- | :--- |
| `mock` | `MockCompetitorAdapter` | [src/infra/research/Meta/MockCompetitorAdapter.ts](src/infra/research/Meta/MockCompetitorAdapter.ts) |
| `live` | `LiveCompetitorAdapter` | [src/infra/research/Meta/LiveCompetitorAdapter.ts](src/infra/research/Meta/LiveCompetitorAdapter.ts) |

### Fulfilment (`FulfilmentPort`)
| Mode | Class Name | File Path |
| :--- | :--- | :--- |
| `mock` | `MockFulfilmentAdapter` | [src/infra/fulfilment/MockFulfilmentAdapter.ts](src/infra/fulfilment/MockFulfilmentAdapter.ts) |
| `live` | `LiveFulfilmentAdapter` | [src/infra/fulfilment/LiveFulfilmentAdapter.ts](src/infra/fulfilment/LiveFulfilmentAdapter.ts) |

### Email (`EmailPort`)
| Mode | Class Name | File Path |
| :--- | :--- | :--- |
| `mock` | `MockEmailAdapter` | [src/infra/email/MockEmailAdapter.ts](src/infra/email/MockEmailAdapter.ts) |
| `live` | `LiveEmailAdapter` | [src/infra/email/LiveEmailAdapter.ts](src/infra/email/LiveEmailAdapter.ts) |

## 4. Core Services

These services contain the business logic and orchestrate the agents and adapters.

| Service | Class Name | File Path |
| :--- | :--- | :--- |
| **Simulation** | `SimulationService` | [src/core/services/SimulationService.ts](src/core/services/SimulationService.ts) |
| **Config** | `ConfigService` | [src/infra/config/ConfigService.ts](src/infra/config/ConfigService.ts) |
| **Activity Log** | `ActivityLogService` | [src/core/services/ActivityLogService.ts](src/core/services/ActivityLogService.ts) |
| **Research Staging**| `ResearchStagingService`| [src/core/services/ResearchStagingService.ts](src/core/services/ResearchStagingService.ts) |
| **Workflow Manager** | `WorkflowManager` | [src/core/workflow/WorkflowManager.ts](src/core/workflow/WorkflowManager.ts) |
| **MCP Server** | `MCPServer` | [src/core/mcp/server.ts](src/core/mcp/server.ts) |
| **Logger** | `LoggerService` | [src/infra/logging/LoggerService.ts](src/infra/logging/LoggerService.ts) |

## 5. API & Entry Points

The system exposes an API for the frontend control panel.

- **Main Entry**: [src/index.ts](src/index.ts) (Express server setup)
- **Routes**:
    - **Activity**: [src/api/activity-routes.ts](src/api/activity-routes.ts) - Logs and system events.
    - **Briefs**: [src/api/brief-routes.ts](src/api/brief-routes.ts) - Product opportunity briefs.
    - **Staging**: [src/api/staging-routes.ts](src/api/staging-routes.ts) - Research staging area.
    - **Agents**: Defined inline in [src/index.ts](src/index.ts) (`/api/agents`).
    - **Config**: Defined inline in [src/index.ts](src/index.ts) (`/api/config`).
    - **Simulation**: Defined inline in [src/index.ts](src/index.ts) (`/api/simulation/*`) - Controls for the simulation loop.
    - **Data Access**: Defined inline in [src/index.ts](src/index.ts) (`/api/products`, `/api/orders`, `/api/ads`, `/api/logs`, `/api/db/*`).
    - **Docker Control**: Defined inline in [src/index.ts](src/index.ts) (`/api/docker/*`).

## 6. Configuration Files

- **Agents**: [config/agents.yaml](config/agents.yaml) - Defines agent prompts and capabilities.
- **Bootstrap**: [config/bootstrap.yaml](config/bootstrap.yaml) - Base configuration for adapter selection.
    - `bootstrap.live.yaml`: Overrides for Live mode.
    - `bootstrap.sim.yaml`: Overrides for Simulation mode.
- **Infrastructure**: [config/infrastructure.yaml](config/infrastructure.yaml) - API keys and connection strings.
- **Workflows**: [config/workflows.yaml](config/workflows.yaml) - Defines event subscriptions and agent reactions.
- **MCP**: [config/mcp.yaml](config/mcp.yaml) - Configuration for Model Context Protocol servers and tools.
