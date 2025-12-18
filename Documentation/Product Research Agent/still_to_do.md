# Still To Do - Product Research Agent

Based on the review of `doc_2_product_research_agent_pseudocode.md` vs `ProductResearchAgent.ts`.

## 1. Multi-Signal Discovery (Section 3)
The current implementation relies heavily on Search (TrendAnalysis) and Competitor analysis. To achieve true "Federated Sensing", the following ports need to be defined and integrated:

- [ ] **Social Signal Integration**
  - Define `SocialPulsePort` (interface for `MCP.SOCIAL.SCAN`).
  - Implement adapter (e.g., TikTok/Instagram API or scraper wrapper).
  - Update `collectSignals` to query this port.

- [ ] **Marketplace Signal Integration**
  - Define `MarketplacePort` (interface for `MCP.MARKETPLACE.MOVERS`).
  - Implement adapter (e.g., Amazon Best Sellers / JungleScout wrapper).
  - Update `collectSignals` to query this port.

- [ ] **Supplier Signal Integration**
  - Define `SupplierPort` (interface for `MCP.SUPPLIER.CATALOG_SCAN`).
  - Implement adapter (e.g., AliExpress/CJ Dropshipping wrapper).
  - Update `collectSignals` to query this port.

## 2. Feedback Loop Subscriptions
The agent needs to learn from downstream results.

- [ ] **Subscribe to `Experiment.ResultsRecorded`**
  - Logic: When an experiment finishes, ingest the result as a `PriorLearning` for future requests.
- [ ] **Subscribe to `Decision.Killed`**
  - Logic: When a product is killed later in the lifecycle, record the reason to avoid repeating the mistake.

## 3. Extended Handoffs (Section 11)
The current handoff only covers Supplier and Marketing.

- [ ] **Emit `Operations.RiskReviewRequested`**
  - Trigger: When a brief involves complex logistics (e.g., fragile items).
- [ ] **Emit `Analytics.ScoreReviewRequested`**
  - Trigger: To request a human or advanced AI review of the certainty score.
