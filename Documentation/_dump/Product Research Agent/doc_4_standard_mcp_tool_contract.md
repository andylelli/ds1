# DOCUMENT 4
## Standard MCP Tool Contract
*(Product Research Agent – External Signal Normalization)*

---

## PURPOSE

This document defines **what each MCP connector must return**, not how it is implemented.

Goals:
- Normalize wildly different platforms into a **common signal model**
- Allow the Product Research Agent to reason **without platform-specific logic**
- Support evidence traceability and certainty labeling
- Enable future connector swaps without breaking the agent

---

## CORE DESIGN PRINCIPLES

1. **All connectors expose the same logical capabilities**
2. **All outputs are evidence, not conclusions**
3. **Time and provenance are first-class**
4. **Quantitative + qualitative signals are both required**
5. **Partial data is allowed; silent failure is not**

---

## COMMON MCP RESPONSE ENVELOPE (REQUIRED)

Every MCP tool response must conform to this envelope:

```
McpResponse
├─ source
├─ signal_type
├─ query_context
├─ timeframe
├─ retrieved_at
├─ confidence_level
├─ items[]
├─ notes
```

### Envelope Fields

| Field | Type | Required | Notes |
|-----|-----|---------|------|
| `source` | string | yes | e.g. `instagram`, `google_search`, `amazon` |
| `signal_type` | enum | yes | `social`, `search`, `marketplace`, `ads`, `supplier` |
| `query_context` | object | yes | keywords, category, geo |
| `timeframe` | object | yes | start/end |
| `retrieved_at` | timestamp | yes | ISO |
| `confidence_level` | enum | yes | `low`, `medium`, `high` |
| `items` | array | yes | Signal-specific payload |
| `notes` | string | no | Caveats, known gaps |

---

## NORMALIZED SIGNAL ITEM (BASE STRUCTURE)

Each item in `items[]` must include:

```
SignalItem
├─ item_id
├─ item_type
├─ title_or_label
├─ description
├─ metrics
├─ qualitative
├─ url
```

### Base Fields

| Field | Type | Required |
|-----|-----|---------|
| `item_id` | string | yes |
| `item_type` | enum | yes (`post`, `query`, `product`, `ad`, `listing`) |
| `title_or_label` | string | yes |
| `description` | string | no |
| `metrics` | object | yes |
| `qualitative` | object | no |
| `url` | string | no |

---

## SIGNAL-SPECIFIC CONTRACTS

Below are the **minimum required fields** per signal type.

---

### 1. Social Momentum MCP Tool

**Purpose:** detect emerging behavior, formats, and pain signals.

**SignalItem.metrics**
- `engagement_total`
- `engagement_velocity`
- `post_frequency`
- `creator_count`

**SignalItem.qualitative**
- `common_phrases`
- `expressed_problems`
- `expressed_desires`
- `sentiment_distribution`

---

### 2. Search Intent MCP Tool

**Purpose:** detect active problem-solving demand.

**SignalItem.metrics**
- `search_volume_estimate`
- `growth_rate`
- `seasonality_index`
- `competition_index`

**SignalItem.qualitative**
- `question_variants`
- `problem_language_samples`
- `related_queries`

---

### 3. Marketplace Movement MCP Tool

**Purpose:** detect buyer willingness and price reality.

**SignalItem.metrics**
- `listing_count`
- `new_listing_velocity`
- `review_velocity`
- `price_min`
- `price_max`

**SignalItem.qualitative**
- `common_complaints`
- `common_praises`
- `feature_expectations`

---

### 4. Competitive Ads MCP Tool

**Purpose:** detect saturation and creative fatigue.

**SignalItem.metrics**
- `advertiser_count`
- `creative_variants`
- `creative_refresh_rate`
- `estimated_spend_proxy`

**SignalItem.qualitative**
- `dominant_hooks`
- `claims_used`
- `positioning_patterns`
- `obvious_gaps`

---

### 5. Supplier Ecosystem MCP Tool

**Purpose:** detect feasibility and manufacturing momentum.

**SignalItem.metrics**
- `supplier_count`
- `price_floor`
- `variant_count`
- `availability_status`

**SignalItem.qualitative**
- `minimum_order_notes`
- `shipping_method_notes`
- `qc_risk_indicators`

---

## REQUIRED MCP ACTIONS (PRODUCT RESEARCH ONLY)

Every connector must expose these **logical actions**:

```
scan(query, timeframe, geo) -> McpResponse
sample(query, limit)        -> McpResponse
```

Optional (but recommended):

```
compare(query_a, query_b)   -> McpResponse
```

---

## ERROR & DEGRADED DATA HANDLING

If data is incomplete or unavailable:
- MCP must return a valid envelope
- `confidence_level` must be downgraded
- `notes` must explain the limitation

**Silent nulls are forbidden.**

---

## TRACEABILITY RULE

Every `SignalItem.item_id` must be:
- unique
- stable for at least one research cycle
- referencable from Opportunity Brief `evidence_references`

---

## WHAT THIS CONTRACT INTENTIONALLY EXCLUDES

- Authentication details
- Rate limits
- Platform-specific schemas
- Scraping logic
- Storage format

These belong outside the Product Research Agent boundary.

---

## DEFINITION OF DONE (DOC 4)

- Product Research Agent can reason across sources uniformly
- Signals can be compared and weighted
- Evidence can be audited post-decision
- New platforms can be added without agent changes

---

**Document 4 complete.**

