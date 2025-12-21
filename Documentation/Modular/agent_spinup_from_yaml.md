# Agent spin-up from YAML manifests

This guide describes how to boot the ds1 agents using the base `BaseAgent` contract (`src/agents/BaseAgent.ts`) and the YAML manifests already in `Documentation/Blueprints/`. It is meant to be code-ready without modifying runtime logic: a loader reads the YAML, maps it to the existing adapters and agent classes, and starts the simulation loop in a single container.

## Inputs
- **Agent registry**: `Documentation/Blueprints/agent_config.yaml` — roles, tools, event subscriptions, adapter bindings, and HTTP exposure per agent.
- **Event contracts**: `Documentation/Blueprints/event_bus.yaml` — producers/consumers, payload schemas, and routing hints for the in-process bus.
- **Bootstrap knobs**: `Documentation/Blueprints/yaml_bootstrap_playbook.md` — ports, ingress endpoints, schedulers, feature flags, AI policies, observability, security, and testing profiles.

## Spin-up flow (no code change required)
1. **Load and validate manifests**
   - Read the three YAML files at startup; validate them against JSON Schema to enforce required fields (e.g., `agents[*].adapters.db`, `events[*].contracts.consumers`).
   - Allow environment overlays (e.g., `bootstrap.simulation.yaml`) to override adapter modes or secrets without touching code.

2. **Materialize adapters from the YAML**
   - Build a registry that maps logical adapter keys to concrete classes already used in `src/index.ts`:
     - `db`: `PostgresAdapter` or `MockAdapter` (from `configService`’s `dbMode`).
     - `shop`: `LiveShopAdapter`, `TestShopAdapter`, or `MockShopAdapter`.
     - `ads`: `LiveAdsAdapter`, `TestAdsAdapter`, or `MockAdsAdapter`.
     - `trends`: `LiveTrendAdapter` or `MockTrendAdapter`.
     - `research`: `LiveCompetitorAdapter` or `MockCompetitorAdapter`.
     - `fulfilment`: `LiveFulfilmentAdapter` or `MockFulfilmentAdapter`.
     - `email`: `LiveEmailAdapter` or `MockEmailAdapter`.
     - `ai`: `LiveAiAdapter` or `MockAiAdapter`.
   - The loader resolves each `agents[*].adapters` entry to a concrete instance, mirroring the switch logic currently in `src/index.ts`.

3. **Instantiate agents from the registry**
   - Maintain a lookup of agent IDs to classes: `ceo → CEOAgent`, `research → ProductResearchAgent`, `supplier → SupplierAgent`, `store → StoreBuildAgent`, `marketing → MarketingAgent`, `support → CustomerServiceAgent`, `ops → OperationsAgent`, `analytics → AnalyticsAgent`.
   - For each agent definition in `agent_config.yaml`, construct the class with the adapters specified in YAML (falling back to defaults in the bootstrap file). All agents inherit `log`, `handleMessage`, and tool execution tracing from `BaseAgent`, so no extra glue is required.

4. **Wire team and orchestration**
   - After instantiation, call `setTeam` on `CEOAgent` with the full agent map, matching the existing pattern in `src/index.ts`.
   - Initialize `SimulationService` with the resolved `db` adapter and agent map so the simulation loop starts with YAML-driven dependencies.

5. **Bind events and endpoints**
   - Use `event_bus.yaml` to register producers/consumers on the in-process bus (Phase 1) and future Redis Pub/Sub (Phase 2). Apply filters, retries, and DLQs from the manifest for each event handler.
   - Expose any HTTP endpoints declared in `agent_config.yaml` (e.g., `debug.expose_http`) via Express, using `public/` assets as-is; no code changes are necessary because the bootstrap loader mounts routes before calling `app.listen`.
   - Interface with external ports and endpoints through Model Context Protocol (MCP) providers declared in YAML so that agents spawned from the manifests resolve their adapters via MCP channels rather than bespoke glue code. This keeps port bindings declarative and traceable for both human and AI readers.

## MCP alignment with existing documentation
- **Protocol grammar:** Mirrors the roles, verbs, and JSON-RPC contracts documented in `Documentation/Reference/MCP_EXPLAINED.md` so the YAML loader preserves the same client/server vocabulary already described for `src/mcp/`.
- **Usage patterns:** Follows the narrative guidance in `Documentation/Narrative/EVENT_BUS_AND_MCP_AUDIO.html` on pairing MCP tools with event-driven wakeups; YAML `events` and `agents[*].adapters` should reflect those pairings.
- **Role responsibilities:** Keeps the tooling boundaries outlined in `Documentation/Reference/AGENT_ROLES.md` where MCP provides standardized access to Shopify/Ads/DB tools; the manifest’s adapter entries should map 1:1 to those MCP toolkits.
- **Workflow tie-in:** Consistent with the MCP tool/action callouts in the workflow guides under `Documentation/Workflows/`, ensuring YAML-defined MCP providers match the actions referenced there (e.g., refunds, ad toggles, support responses).

## Minimal loader skeleton (conceptual)

```ts
// pseudo-code to show control flow; no repo code changes required
const manifests = loadYamls(['agent_config.yaml', 'event_bus.yaml', 'bootstrap.yaml']);
const adapters = buildAdapters(manifests.bootstrap.adapters, configService);
const agents = instantiateAgents(manifests.agents, adapters); // uses BaseAgent subclasses
agents.ceo.setTeam(agents);
registerEventBus(manifests.events, agents);
startServices({ agents, adapters, manifests });
```

This approach keeps runtime decisions in YAML while reusing the existing `BaseAgent` inheritance tree, adapter implementations, and simulation service.