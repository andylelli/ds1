# 🕵️ 03. Product Research Agent (The Hunter)

## 1. Executive Summary
The **Product Research Agent** is the "Hunter" of the swarm. Its sole purpose is to scan the market, identify trending niches, and surface high-potential products that meet specific criteria (e.g., high demand, low competition).

Unlike simple scrapers, this agent acts as a **Strategic Analyst**. It doesn't just find products; it builds a business case for them. It ingests raw signals, clusters them into themes, validates them against strict kill criteria, and produces a comprehensive **Opportunity Brief** that downstream agents can execute without ambiguity.

### 🚧 Current Implementation Blockers
*   **Meta Ads Library**: The `LiveCompetitorAdapter` is implemented but currently restricted by Meta's "Development Mode". We cannot query public ads until the App Review is complete and "Live Mode" is enabled.
*   **Google Ads Keyword Planner**: The `LiveAdsAdapter` is implemented but restricted by the "Explorer" access level. We cannot retrieve search volume data until "Basic Access" is approved (requires application with design docs).

### ✅ Verified Capabilities
*   **Competitor Discovery**: `LiveCompetitorAdapter` (via SerpApi) successfully identifies competitors from Google Search.
*   **Video Validation**: `LiveVideoAdapter` (via YouTube Data API) successfully fetches video views, likes, and comments to validate viral interest.
*   **Shopify Compliance**: `LiveShopAdapter` successfully checks product names against prohibited keyword lists.

---

## 2. Core Responsibilities
*   **Market Scanning**: Continuously monitors social media (TikTok, Pinterest), search engines (Google Trends), and marketplaces (Amazon, AliExpress) for emerging signals.
*   **Theme Generation**: Clusters disparate signals into coherent product themes (e.g., "At-home Cryotherapy" from signals about "ice rollers" and "cold plunges").
*   **Strategic Gating**: Enforces the business's risk profile by killing ideas that are too low-margin, too risky, or off-brand.
*   **Deep Validation**: rigorous checks on competition density, pricing viability, and seasonality.
*   **Brief Creation**: Packages the validated opportunity into a structured JSON artifact (`OpportunityBrief`) containing 14 distinct sections of analysis.

---

## 3. Internal Logic Flow (The 11-Step Pipeline)

The Product Research Agent executes a rigorous, multi-phase pipeline to ensure only high-quality, validated opportunities reach the CEO. The process is divided into "Real Intelligence" (Phase 1) and "Heuristic/Mocked" (Phase 2 & 3) steps for the current Pilot phase.

### Phase 1: Context & Discovery (Real Intelligence)
These steps are fully functional and use real external data or AI.

1.  **Request Intake & Normalization**:
    *   **Purpose**: Converts a vague human request (e.g., "Find Pet Products") into a structured strategic directive.
    *   **Implementation**: Uses **OpenAI** (via `OpenAIService`) to parse the request against the `StrategyProfile`.
    *   **Status**: ✅ **Real AI**.

2.  **Prior Learning Ingestion**:
    *   **Purpose**: Prevents repeating past mistakes by loading historical context.
    *   **Implementation**: Queries the `PersistencePort` for past products. Currently stubbed to return empty arrays until history is built.
    *   **Status**: ⚠️ **Stubbed** (Placeholder for future memory).

3.  **Multi-Signal Discovery**:
    *   **Purpose**: Gathers raw market data from multiple independent sources.
    *   **Implementation**: Iterates through adapters to collect signals:
        *   **Trends**: `LiveTrendAdapter` (Google Trends) - ✅ Real Data.
        *   **Competitor**: `LiveCompetitorAdapter` (SerpApi/Meta) - ✅ Real Data (Stubbed if key missing).
        *   **Video**: `LiveVideoAdapter` (YouTube API) - ✅ Real Data.
        *   **Ads**: `LiveAdsAdapter` (Google Ads) - ✅ Real Data (Restricted).
        *   **Shop**: `LiveShopAdapter` (Shopify Policy) - ✅ Real Logic.
    *   **Status**: ✅ **Real Data**.

### Phase 2: Filtering & Ranking (Heuristic/Mocked)
These steps exist and process data, but the decision logic is currently simplified (heuristics or random variance) rather than using deep AI analysis.

4.  **Theme Generation**:
    *   **Purpose**: Clusters disparate signals into coherent product opportunities.
    *   **Implementation**: Groups signals by simple string matching (product name).
    *   **Status**: ⚠️ **Heuristic** (Basic grouping, not LLM clustering).

5.  **Strategic Gating**:
    *   **Purpose**: The "Kill Switch". Immediately discards ideas that violate business rules.
    *   **Implementation**: Checks themes against a hardcoded blacklist (e.g., "weapons") and brief constraints.
    *   **Status**: ✅ **Functional** (Rule-based).

6.  **Scoring & Ranking**:
    *   **Purpose**: Prioritizes opportunities based on potential and risk.
    *   **Implementation**: Calculates a score based on signal count + random variance (simulating market demand).
    *   **Status**: ⚠️ **Heuristic** (Math.random() used for demand simulation).

7.  **Time & Cycle Fitness**:
    *   **Purpose**: Ensures the opportunity is actionable *now*.
    *   **Implementation**: Randomly assigns a "trend phase" (Early/Mid/Late) to test the logic.
    *   **Status**: ⚠️ **Mocked** (Random phase assignment).

### Phase 3: Validation & Packaging (Template-Based)
These steps structure the output but rely on templates rather than dynamic generation.

8.  **Deep Validation**:
    *   **Purpose**: Rigorous stress-testing (reviews, pricing).
    *   **Implementation**: Attaches static mock validation data (e.g., "Love the concept but...").
    *   **Status**: ⚠️ **Mocked** (Static text).

9.  **Productization (Offer Concepts)**:
    *   **Purpose**: Transforms a raw "Theme" into a sellable "Concept".
    *   **Implementation**: Creates concepts using a static template.
    *   **Status**: ⚠️ **Template-based**.

10. **Opportunity Brief Creation**:
    *   **Purpose**: Creates the final artifact for the CEO.
    *   **Implementation**: Maps all collected data into the strict 14-section `OpportunityBrief` schema and saves to the Database.
    *   **Status**: ✅ **Functional**.

11. **Handoff via Events**:
    *   **Purpose**: Triggers the next phase of the business lifecycle.
    *   **Implementation**: Publishes `Supplier.FeasibilityRequested` and `Marketing.AngleWhitespaceRequested` events.
    *   **Status**: ✅ **Functional**.

---

## 4. Adapter Summary

| Adapter | Step(s) | Status | Notes |
| :--- | :--- | :--- | :--- |
| **OpenAIService** | 1, 9 (Future) | ✅ Active | Used for request parsing. |
| **LiveTrendAdapter** | 3 | ✅ Active | Google Trends integration. |
| **LiveCompetitorAdapter** | 3 | ✅ Active | SerpApi (Search) & Meta (Ads). |
| **LiveAdsAdapter** | 3 | 🟡 Restricted | Google Ads (Explorer Access). |
| **LiveVideoAdapter** | 3, 8 (Future) | ✅ Active | YouTube Data API. |
| **LiveShopAdapter** | 3 | ✅ Active | Shopify Policy Check. |
| **PersistencePort** | 2, 10 | ✅ Active | Postgres DB. |
| **EventBusPort** | 11 | ✅ Active | Internal Event Bus. |

---

## 5. Data Structures

### Opportunity Brief (The Artifact)
The central JSON document passed to downstream agents. It is strictly typed and validated.

```typescript
export interface OpportunityBrief {
    meta: OpportunityBriefMeta;
    opportunity_definition: OpportunityDefinition;
    customer_problem: CustomerProblem;
    demand_evidence: DemandEvidence;
    competition_analysis: CompetitionAnalysis;
    pricing_and_economics: PricingAndEconomics;
    offer_concept: OfferConcept;
    differentiation_strategy: DifferentiationStrategy;
    risk_assessment: RiskAssessment;
    time_and_cycle: TimeAndCycle;
    validation_plan: ValidationPlan;
    kill_criteria: KillCriteria;
    assumptions_and_certainty: AssumptionsAndCertainty;
    evidence_references: EvidenceReferences;
}
```

### Signal
Raw market data points.
```typescript
interface Signal {
    id: string;
    family: 'social' | 'search' | 'marketplace' | 'competitor';
    source: string; // e.g., "TikTok", "Google Trends"
    data: any;
}
```

### Theme
Clustered signals representing a potential opportunity.
```typescript
interface Theme {
    id: string;
    name: string;
    supporting_signals: string[]; // IDs
    score: number;
    validation: ValidationData;
}
```

---

## 6. Event Interface

### Subscribes To
| Event | Source | Action |
| :--- | :--- | :--- |
| `OpportunityResearch.Requested` | CEO Agent / Scheduler | Triggers the 11-step pipeline. Payload: `{ request_id, criteria }` |

### Publishes
| Event | Payload | Description |
| :--- | :--- | :--- |
| `OpportunityResearch.BriefsPublished` | `{ brief_id, briefs[] }` | The primary output. Contains the full `OpportunityBrief` objects. |
| `OpportunityResearch.SignalsCollected` | `{ signal_count, sources }` | Emitted for the Analytics Agent to track market coverage. |
| `OpportunityResearch.ShortlistRanked` | `{ candidates[] }` | Emitted for observability of the ranking process. |

---

## 7. Future Roadmap
*   **Visual Analysis**: Integrating Vision LLMs to analyze product images from social media signals.
*   **Sentiment Analysis**: Deeper NLP on customer reviews to identify "Customer Problem" more accurately.
*   **Real-time Feedback**: Listening to `Marketing.CampaignResult` events to update `PriorLearnings` automatically.
*   **Full AI Logic**: Replace heuristics in Steps 4, 6, 7, 8, 9 with LLM-based reasoning once the pipeline is fully stabilized.

---

## 8. 11 Steps Update Plan

This section tracks the specific engineering plan to upgrade "Stubbed" or "Heuristic" steps into "Real Solutions".

### 🎯 Upgrade Focus: Step 2 (Prior Learning Ingestion)

**Objective**: Transform the agent from "Amnesiac" to "Experienced". The agent must query historical product performance to adjust its risk calculations for new opportunities.

#### Current State (Stubbed)
*   **Code**: `src/agents/ProductResearchAgent.ts` calls `this.db.getPriorLearnings()`.
*   **Behavior**: Returns `[]` (Empty Array).
*   **Impact**: The agent treats every "Electronics" product as a fresh idea, ignoring that we failed 3 times previously due to high returns.

#### Target State (Real Solution)
*   **Behavior**: The agent queries the `products` table for items with matching categories.
*   **Logic**:
    1.  Fetch past products in target category (e.g., "Pet Supplies").
    2.  Calculate `WinRate` (Profitable Launches / Total Attempts).
    3.  Generate a `RiskModifier`:
        *   If WinRate < 20%: Apply `-15` score penalty.
        *   If WinRate > 60%: Apply `+10` score boost.
    4.  Inject these learnings into the `Context` object for use in Step 6 (Scoring).

#### Implementation Phases

**Phase 1: Database Schema & Seeding**
*   [ ] **Schema Check**: Ensure `products` table has `outcome` (launched/killed), `profit_margin`, and `return_rate` columns.
*   [ ] **Seed Data**: Insert 5-10 "Historical" products with mixed outcomes (some winners, some losers) into `sandbox_db.json` or Postgres.

**Phase 2: Adapter Implementation**
*   [ ] **Update Interface**: Ensure `PersistencePort` has `getPriorLearnings(category: string): Promise<HistoricalProduct[]>`.
*   [ ] **Implement Logic**: In `PostgresPersistenceAdapter` (or `MockDbAdapter` for now), write the query to aggregate stats by category.

**Phase 3: Agent Logic Integration**
*   [ ] **Modify Step 2**: Update `ProductResearchAgent.ts` to process the returned `HistoricalProduct[]`.
*   [ ] **Create Risk Calculator**: Implement a helper function `calculateRiskAdjustment(history)` that returns a score modifier.
*   [ ] **Update Step 6 (Scoring)**: Ensure the `scoreAndRankThemes` function actually *uses* this modifier in the final calculation.

**Phase 4: Verification**
*   [ ] **Test Case**: Create `test-learning-logic.ts`.
    *   Run Agent for "Electronics" (Seeded with failures) -> Expect Lower Scores.
    *   Run Agent for "Home Decor" (Seeded with wins) -> Expect Higher Scores.