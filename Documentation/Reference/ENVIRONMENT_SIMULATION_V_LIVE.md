# 🌍 Environments: Simulation vs. Live

**Status:** Active
**Date:** December 2025

This guide explains the **Architectural Symmetry** of the DropShip AI system. The core code (Agents, Event Bus, Logic) is identical in both environments. The only difference is the **Configuration** (Adapters & Database).

## 1. The Core Principle: Symmetry

We do not write "Simulation Code" and "Live Code". We write **One System** that runs in two modes.

| Feature | Simulation Mode (`npm run sim`) | Live Mode (`npm start`) |
| :--- | :--- | :--- |
| **Trigger** | `SimulationService` (Scripted Loop) | `Express` (Webhooks/User Input) |
| **Database** | `dropship_sim` (Reset on boot) | `dropship` (Persistent) |
| **Adapters** | `MockShopify`, `MockOpenAI` | `ShopifyAdapter`, `OpenAIAdapter` |
| **Time** | `VirtualClock` (1 hour = 1 second) | `RealTime` (System Clock) |
| **Money** | Monopoly Money (Tracked in Ledger) | Real USD (Stripe/Bank) |

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
    Bus{{Postgres Event Bus}}:::hub
  end

  %% --- 3. SWARM ---
  subgraph Swarm ["3. The Agent Swarm"]
    direction TB
    CEO[CEO Agent]:::agent
    
    subgraph Row1 ["Growth Team"]
      direction LR
      Analytics[Analytics]:::agent
      Researcher[Researcher]:::agent
      Builder[Builder]:::agent
      Marketer[Marketer]:::agent
    end
    
    subgraph Row2 ["Ops Team"]
      direction LR
      Ops[Operations]:::agent
      CS[Support]:::agent
      Retention[Retention]:::agent
      Compliance[Compliance]:::agent
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
    MockShop[Mock Shopify]:::mock
    MockAds[Mock Ads]:::mock
    MockSupplier[Mock Supplier]:::mock
    MockEmail[Console Email]:::mock
  end

  %% --- 6. DATA ---
  subgraph Data ["6. Persistence"]
    DB[(Postgres: dropship_sim)]:::db
  end

  %% Wiring: Inputs -> Bus
  SimService & Clock --> Bus

  %% Wiring: Bus -> Everyone (Hub & Spoke)
  Bus ==> CEO
  Bus ==> Analytics & Researcher & Builder & Marketer
  Bus ==> Ops & CS & Retention & Compliance

  %% Visual Hierarchy (No Data Flow)
  CEO ~~~ Row1
  Row1 ~~~ Row2

  %% Tool Connections
  Researcher --> TrendsTool
  Builder --> ShopTool
  Marketer --> AdsTool
  Ops --> FulfillTool
  CS & Retention --> EmailTool
  Analytics --> LedgerTool
  Compliance --> AdsTool

  %% Mock Connections
  TrendsTool --> MockTrends
  ShopTool --> MockShop
  AdsTool --> MockAds
  FulfillTool --> MockSupplier
  EmailTool --> MockEmail
  
  %% Data
  CEO ~~~ DB
  LedgerTool -->|SQL| DB
```

### 2.2 Live Mode (The "Business")
In this mode, the system waits for the real world. It reacts to Webhooks (Shopify, Stripe) or User Commands (Dashboard).

```mermaid
flowchart TD
  %% Styles
  classDef trigger fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#0d47a1;
  classDef hub fill:#ffecb3,stroke:#ff6f00,stroke-width:3px,color:#e65100;
  classDef agent fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#1b5e20;
  classDef mcp fill:#fff8e1,stroke:#fbc02d,stroke-width:2px,color:#f57f17;
  classDef external fill:#ffebee,stroke:#c62828,stroke-width:2px,color:#b71c1c;
  classDef db fill:#eceff1,stroke:#455a64,stroke-width:2px,color:#263238;

  %% --- 1. INPUTS ---
  subgraph Triggers ["1. The Real World"]
    direction LR
    User[User Dashboard]:::trigger
    ShopHook[Shopify Webhook]:::trigger
    StripeHook[Stripe Webhook]:::trigger
  end

  %% --- 2. API ---
  subgraph Ingress ["2. API Layer"]
    Express[Express Server]:::trigger
  end

  %% --- 3. BUS ---
  subgraph Central ["3. The Central Nervous System"]
    Bus{{Postgres Event Bus}}:::hub
  end

  %% --- 4. SWARM ---
  subgraph Swarm ["4. The Agent Swarm"]
    direction TB
    CEO[CEO Agent]:::agent
    
    subgraph Row1 ["Growth Team"]
      direction LR
      Analytics[Analytics]:::agent
      Researcher[Researcher]:::agent
      Builder[Builder]:::agent
      Marketer[Marketer]:::agent
    end
    
    subgraph Row2 ["Ops Team"]
      direction LR
      Ops[Operations]:::agent
      CS[Support]:::agent
      Retention[Retention]:::agent
      Compliance[Compliance]:::agent
    end
  end

  %% --- 5. TOOLS ---
  subgraph MCP ["5. Tool Interface (MCP)"]
    direction LR
    TrendsTool[Trends]:::mcp
    ShopTool[Shopify]:::mcp
    AdsTool[Ads]:::mcp
    FulfillTool[Fulfillment]:::mcp
    EmailTool[Email]:::mcp
    LedgerTool[Ledger]:::mcp
  end

  %% --- 6. EXTERNAL ---
  subgraph External ["6. External APIs"]
    direction LR
    Google[Google Trends]:::external
    Shopify[Shopify API]:::external
    Meta[Meta Ads API]:::external
    AliExpress[AliExpress API]:::external
    SendGrid[SendGrid API]:::external
  end

  %% --- 7. DATA ---
  subgraph Data ["7. Persistence"]
    DB[(Postgres: dropship)]:::db
  end

  %% Wiring: Inputs -> Bus
  User & ShopHook & StripeHook --> Express
  Express --> Bus

  %% Wiring: Bus -> Everyone (Hub & Spoke)
  Bus ==> CEO
  Bus ==> Analytics & Researcher & Builder & Marketer
  Bus ==> Ops & CS & Retention & Compliance

  %% Visual Hierarchy (No Data Flow)
  CEO ~~~ Row1
  Row1 ~~~ Row2

  %% Agent -> Tool Connections
  Researcher --> TrendsTool
  Builder --> ShopTool
  Marketer --> AdsTool
  Ops --> FulfillTool
  CS & Retention --> EmailTool
  Analytics --> LedgerTool
  Compliance --> AdsTool

  %% External Connections
  TrendsTool --> Google
  ShopTool --> Shopify
  AdsTool --> Meta
  FulfillTool --> AliExpress
  EmailTool --> SendGrid
  
  %% Data
  CEO ~~~ DB
  LedgerTool -->|SQL| DB
```

## 3. Configuration Differences

The environment is controlled by the `bootstrap.yaml` configuration (or `.env` overrides).

### 3.1 Infrastructure
*   **Event Bus:** Both use `PostgresEventStore`.
    *   *Sim:* Polls frequently or uses in-memory dispatch for speed.
    *   *Live:* Uses reliable polling/subscriptions.
*   **Database:**
    *   *Sim:* `DROP SCHEMA public CASCADE` on boot. Seeds with `sandbox_db.json` data.
    *   *Live:* Never drops data. Migrations only.

### 3.2 Adapters (The Interface Layer)

| Adapter | Simulation Implementation | Live Implementation |
| :--- | :--- | :--- |
| **Shop** | `InMemoryShop`: Stores products in RAM/DB. | `ShopifyAdapter`: Calls Shopify Admin API. |
| **Marketing** | `MockAds`: Returns fake CPC/CTR data. | `MetaAdsAdapter`: Calls Facebook Marketing API. |
| **Email** | `ConsoleEmail`: Prints email to terminal. | `SendGridAdapter`: Sends real emails. |
| **Research** | `MockTrends`: Returns static trend data. | `GoogleTrendsAdapter`: Scrapes real trends. |
| **Payment** | `MockStripe`: Always succeeds. | `StripeAdapter`: Processes real cards. |

## 4. Data Flow & Persistence

### 4.1 The "Reset" Button
*   **Simulation:** Designed to be destroyed. You can run `npm run sim` 100 times a day. It wipes the `dropship_sim` database every time to ensure a clean state.
*   **Live:** Designed to be eternal. The `dropship` database is the "Source of Truth" for the business.

### 4.2 Logging
*   **Simulation:** Logs to `console` and `activity_log` table for debugging.
*   **Live:** Logs to `activity_log` for audit trails and potentially external monitoring (Datadog/Sentry).

## 5. Development Workflow

1.  **Code:** Write a new Agent or Feature.
2.  **Test (Sim):** Run `npm run sim`. Watch the agent interact with Mock Adapters.
    *   *Verify:* Did it handle the "Order Paid" event correctly?
    *   *Verify:* Did it update the Ledger?
3.  **Deploy (Live):** Push to production.
    *   *Config:* Switch `ENV=production`.
    *   *Result:* The exact same code now listens to real Shopify webhooks.

## 6. Safety Guardrails

To prevent "Skynet" scenarios (e.g., spending $10k on ads by mistake), Live Mode has strict limits:
*   **Budget Caps:** Hard limits on Ad Spend per day.
*   **Rate Limits:** API calls are throttled.
*   **Human-in-the-Loop:** Sensitive actions (like "Delete Product" or "Publish Ad Campaign") may require Dashboard approval.
