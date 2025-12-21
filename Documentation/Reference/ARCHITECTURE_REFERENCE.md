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
| `memory` | `MockAdapter` | [src/infra/db/MockAdapter.ts](src/infra/db/MockAdapter.ts) |
| `postgres` | `PostgresAdapter` | [src/infra/db/PostgresAdapter.ts](src/infra/db/PostgresAdapter.ts) |

### Event Bus (`EventBusPort`)
| Mode | Class Name | File Path |
| :--- | :--- | :--- |
| `memory` | `InMemoryEventBus` | [src/infra/events/InMemoryEventBus.ts](src/infra/events/InMemoryEventBus.ts) |
| `postgres` | `PostgresEventBus` | [src/infra/events/PostgresEventBus.ts](src/infra/events/PostgresEventBus.ts) |

> **Note**: `PostgresEventBus` uses `PersistencePort.saveEvent()` to store events in the main database (Postgres or Mock), effectively treating the main DB as the "Event Store".

### Trends Provider (`TrendsPort`)
| Mode | Class Name | File Path |
| :--- | :--- | :--- |
| `simulated` | `MockTrendAdapter` | [src/infra/trends/GoogleTrendsAPI/MockTrendAdapter.ts](src/infra/trends/GoogleTrendsAPI/MockTrendAdapter.ts) |
| `live` | `LiveTrendAdapter` | [src/infra/trends/GoogleTrendsAPI/LiveTrendAdapter.ts](src/infra/trends/GoogleTrendsAPI/LiveTrendAdapter.ts) |

### Shop Platform (`ShopPlatformPort`)
| Mode | Class Name | File Path |
| :--- | :--- | :--- |
| `simulated` | `MockShopAdapter` | [src/infra/shop/MockShopAdapter.ts](src/infra/shop/MockShopAdapter.ts) |
| `shopify` | `LiveShopAdapter` | [src/infra/shop/LiveShopAdapter.ts](src/infra/shop/LiveShopAdapter.ts) |

### Ads Platform (`AdsPlatformPort`)
| Mode | Class Name | File Path |
| :--- | :--- | :--- |
| `simulated` | `MockAdsAdapter` | [src/infra/ads/GoogleAds/MockAdsAdapter.ts](src/infra/ads/GoogleAds/MockAdsAdapter.ts) |
| `google` | `LiveAdsAdapter` | [src/infra/ads/GoogleAds/LiveAdsAdapter.ts](src/infra/ads/GoogleAds/LiveAdsAdapter.ts) |

### AI Provider (`AiPort`)
| Mode | Class Name | File Path |
| :--- | :--- | :--- |
| `simulated` | `MockAiAdapter` | [src/infra/ai/MockAiAdapter.ts](src/infra/ai/MockAiAdapter.ts) |
| `openai` | `LiveAiAdapter` | [src/infra/ai/LiveAiAdapter.ts](src/infra/ai/LiveAiAdapter.ts) |

## 4. Core Services

These services contain the business logic and orchestrate the agents and adapters.

| Service | Class Name | File Path |
| :--- | :--- | :--- |
| **Simulation** | `SimulationService` | [src/core/services/SimulationService.ts](src/core/services/SimulationService.ts) |
| **Config** | `ConfigService` | [src/infra/config/ConfigService.ts](src/infra/config/ConfigService.ts) |
| **Activity Log** | `ActivityLogService` | [src/core/services/ActivityLogService.ts](src/core/services/ActivityLogService.ts) |
| **Research Staging**| `ResearchStagingService`| [src/core/services/ResearchStagingService.ts](src/core/services/ResearchStagingService.ts) |

## 5. API & Entry Points

The system exposes an API for the frontend control panel.

- **Main Entry**: [src/index.ts](src/index.ts) (Express server setup)
- **Routes**:
    - Activity: [src/api/activity-routes.ts](src/api/activity-routes.ts)
    - Briefs: [src/api/brief-routes.ts](src/api/brief-routes.ts)
    - Agents: [src/api/agent-routes.ts](src/api/agent-routes.ts)
    - Admin: [src/api/admin-routes.ts](src/api/admin-routes.ts)

## 6. Configuration Files

- **Agents**: [config/agents.yaml](config/agents.yaml) - Defines agent prompts and capabilities.
- **Bootstrap**: [config/bootstrap.yaml](config/bootstrap.yaml) - Selects which adapters to use (sim vs live).
- **Infrastructure**: [config/infrastructure.yaml](config/infrastructure.yaml) - API keys and connection strings.
