# 🌍 Environments: Simulation vs. Live

**Status:** Active
**Date:** December 2025

This guide explains the **Architectural Symmetry** of the DropShip AI system. The core code (Agents, Event Bus, Logic) is identical in both environments. The only difference is the **Configuration** (Adapters & Database).

## 1. The Core Principle: Symmetry

We do not write "Simulation Code" and "Live Code". We write **One System** that runs in two modes.

| Feature | Simulation Mode (`npm run sim`) | Live Mode (`npm start`) |
| :--- | :--- | :--- |
| **Trigger** | `SimulationService` (Scripted Loop) | `Express` (Webhooks/User Input) |
| **Database** | `MockAdapter` (In-Memory/Reset) | `PostgresAdapter` (Persistent) |
| **Shopify** | `MockShopAdapter` | `LiveShopAdapter` |
| **Trends** | `MockTrendAdapter` | `LiveTrendAdapter` |
| **Ads** | `MockAdsAdapter` | `LiveAdsAdapter` |
| **AI** | `MockAiAdapter` | `LiveAiAdapter` |
| **Time** | `VirtualClock` (1 hour = 1 second) | `RealTime` (System Clock) |

## 2. Architecture Diagrams

### 2.1 Simulation Mode (The "Game")
In this mode, the system runs in a closed loop. The `SimulationService` acts as the "Game Master," injecting events (like "Customer Placed Order") to test how Agents react.

```mermaid
flowchart TD
  %% Styles
  classDef trigger fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#0d47a1;
  classDef hub fill:#ffecb3,stroke:#ff6f00,stroke-width:3px,color:#e65100;
  classDef agent fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#1b5e20;
  classDef mcp fill:#fff8e1,stroke:#fbc02d,stroke-width:2px,color:#f57f17;
  classDef mock fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#4a148c;
  classDef db fill:#eceff1,stroke:#455a64,stroke-width:2px,color:#263238;

  %% --- 1. INPUTS ---
  subgraph Triggers ["1. Inputs"]
    direction LR
    SimService[Simulation Service]:::trigger
    Clock[Virtual Clock]:::trigger
  end

  %% --- 2. BUS ---
  subgraph Central ["2. The Central Nervous System"]
    Bus{{Event Bus}}:::hub
  end

  %% --- 3. SWARM ---
  subgraph Swarm ["3. The Agent Swarm"]
    direction TB
    CEO[CEO Agent]:::agent
    
    subgraph Team ["The Team"]
      direction LR
      Researcher[Product Research]:::agent
      Builder[Store Build]:::agent
      Marketer[Marketing]:::agent
      Supplier[Supplier]:::agent
      Ops[Operations]:::agent
      CS[Customer Service]:::agent
      Analytics[Analytics]:::agent
    end
  end

  %% --- 4. TOOLS ---
  subgraph MCP ["4. Tool Interface (MCP)"]
    direction LR
    TrendsTool[Trends]:::mcp
    ShopTool[Shopify]:::mcp
    AdsTool[Ads]:::mcp
    FulfillTool[Fulfillment]:::mcp
    EmailTool[Email]:::mcp
    LedgerTool[Ledger]:::mcp
  end

  %% --- 5. MOCKS ---
  subgraph Mocks ["5. The Matrix (Simulation)"]
    direction LR
    MockTrends[Mock Trends]:::mock
    MockShop[Mock Shop]:::mock
    MockAds[Mock Ads]:::mock
    MockSupplier[Mock Supplier]:::mock
    MockEmail[Mock Email]:::mock
  end

  %% --- 6. DATA ---
  subgraph Data ["6. Persistence"]
    DB[(Mock DB / Postgres)]:::db
  end

  %% Wiring: Inputs -> Bus
  SimService & Clock --> Bus

  %% Wiring: Bus -> Everyone
  Bus ==> CEO
  Bus ==> Team

  %% Visual Hierarchy: Center CEO above Team
  CEO ~~~ Ops
```

### 2.2 Live Mode
In Live Mode, the `SimulationService` is disabled. The system reacts to real-world events (Webhooks from Shopify, User clicks in Control Panel).

- **Adapters**: Swapped from `Mock*` to `Live*`.
- **Database**: Swapped from `MockAdapter` to `PostgresAdapter`.
- **AI**: Swapped from `MockAiAdapter` (canned responses) to `LiveAiAdapter` (OpenAI GPT-4).
