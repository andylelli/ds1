# DOCUMENT 3
## Opportunity Brief — Strict Schema
*(Product Research Agent output contract)*

---

## PURPOSE

The **Opportunity Brief** is the **only valid output** of the Product Research Agent.

It is:
- machine-readable
- evidence-backed
- uncertainty-aware
- actionable by downstream agents

No product may proceed without a valid Opportunity Brief.

---

## SCHEMA OVERVIEW

```
OpportunityBrief
├─ meta
├─ opportunity_definition
├─ customer_problem
├─ demand_evidence
├─ competition_analysis
├─ pricing_and_economics
├─ offer_concept
├─ differentiation_strategy
├─ risk_assessment
├─ time_and_cycle
├─ validation_plan
├─ kill_criteria
├─ assumptions_and_certainty
├─ evidence_references
```

---

## 1. `meta` (required)

Administrative and traceability fields.

| Field | Type | Required | Notes |
|-----|-----|---------|------|
| `brief_id` | string | yes | Unique, immutable |
| `created_at` | timestamp | yes | ISO format |
| `created_by` | string | yes | `ProductResearchAgent` |
| `research_request_id` | string | yes | Correlation ID |
| `version` | integer | yes | Starts at 1 |
| `status` | enum | yes | `draft`, `published`, `archived` |

---

## 2. `opportunity_definition` (required)

What this opportunity *is*, at a high level.

| Field | Type | Required |
|-----|-----|---------|
| `theme_name` | string | yes |
| `category` | string | yes |
| `seasonality` | enum | yes (`seasonal`, `evergreen`, `hybrid`) |
| `target_geo` | array[string] | yes |
| `target_personas` | array[string] | yes |
| `use_scenario` | string | yes |

---

## 3. `customer_problem` (required)

Must be expressed in **customer language**, not product language.

| Field | Type | Required |
|-----|-----|---------|
| `problem_statement` | string | yes |
| `problem_frequency` | enum | yes (`one-off`, `seasonal`, `recurring`) |
| `current_solutions` | array[string] | yes |
| `problem_urgency` | enum | yes (`low`, `medium`, `high`) |

---

## 4. `demand_evidence` (required)

Why this opportunity exists *now*.

| Field | Type | Required | Notes |
|-----|-----|---------|------|
| `signal_types_used` | array[enum] | yes | `social`, `search`, `marketplace`, `ads`, `supplier` |
| `why_now_summary` | string | yes | Multi-signal narrative |
| `demand_trend_direction` | enum | yes | `rising`, `flat`, `declining` |
| `demand_velocity_confidence` | enum | yes | `low`, `medium`, `high` |

---

## 5. `competition_analysis` (required)

Quality over quantity.

| Field | Type | Required |
|-----|-----|---------|
| `competition_density` | enum | yes (`low`, `medium`, `high`) |
| `competition_quality` | enum | yes (`weak`, `mixed`, `strong`) |
| `dominant_positioning_patterns` | array[string] | yes |
| `obvious_gaps` | array[string] | yes |
| `saturation_risk` | enum | yes (`low`, `medium`, `high`) |

---

## 6. `pricing_and_economics` (required)

Ranges only — no false precision.

| Field | Type | Required |
|-----|-----|---------|
| `expected_price_band` | object | yes |
| `expected_price_band.min` | number | yes |
| `expected_price_band.max` | number | yes |
| `margin_feasibility` | enum | yes (`poor`, `viable`, `strong`) |
| `price_sensitivity` | enum | yes (`low`, `medium`, `high`) |

---

## 7. `offer_concept` (required)

Still an **opportunity**, not a finalized SKU.

| Field | Type | Required |
|-----|-----|---------|
| `core_product_hypothesis` | string | yes |
| `key_attributes` | array[string] | yes |
| `bundle_or_upsell_ideas` | array[string] | yes |
| `expected_complexity` | enum | yes (`low`, `medium`, `high`) |

---

## 8. `differentiation_strategy` (required)

How this avoids commodity traps.

| Field | Type | Required |
|-----|-----|---------|
| `primary_differentiator` | string | yes |
| `secondary_differentiators` | array[string] | yes |
| `angle_whitespace_summary` | string | yes |

---

## 9. `risk_assessment` (required)

Explicit, not implied.

| Field | Type | Required |
|-----|-----|---------|
| `fulfillment_risk` | enum | yes (`low`, `medium`, `high`) |
| `customer_support_risk` | enum | yes (`low`, `medium`, `high`) |
| `platform_policy_risk` | enum | yes (`low`, `medium`, `high`) |
| `supplier_risk_proxy` | enum | yes (`low`, `medium`, `high`) |
| `known_failure_modes` | array[string] | yes |

---

## 10. `time_and_cycle` (required)

Prevents chasing dead trends.

| Field | Type | Required |
|-----|-----|---------|
| `trend_phase` | enum | yes (`early`, `mid`, `late`) |
| `estimated_window_weeks` | integer | yes |
| `execution_speed_fit` | enum | yes (`good`, `tight`, `poor`) |

---

## 11. `validation_plan` (required)

Cheap, fast, falsifiable.

| Field | Type | Required |
|-----|-----|---------|
| `test_type` | enum | yes (`ads`, `landing_page`, `preorder`, `marketplace_probe`) |
| `test_goal` | string | yes |
| `max_test_budget` | number | yes |
| `success_signals` | array[string] | yes |
| `data_required_days` | integer | yes |

---

## 12. `kill_criteria` (required)

Explicit stop rules.

| Field | Type | Required |
|-----|-----|---------|
| `hard_kill_conditions` | array[string] | yes |
| `soft_warning_conditions` | array[string] | yes |
| `decision_owner` | string | yes |

---

## 13. `assumptions_and_certainty` (required)

Prevents hallucinated confidence.

| Field | Type | Required |
|-----|-----|---------|
| `observed_facts` | array[string] | yes |
| `inferred_conclusions` | array[string] | yes |
| `assumptions_to_validate` | array[string] | yes |
| `overall_confidence` | enum | yes (`low`, `medium`, `high`) |

---

## 14. `evidence_references` (required)

Traceability back to MCP outputs.

| Field | Type | Required |
|-----|-----|---------|
| `evidence_ids` | array[string] | yes |
| `signal_source_map` | object | yes | `{ evidence_id: signal_type }` |

---

## VALIDATION RULES (IMPORTANT)

An Opportunity Brief is **invalid** if:
- any required field is missing
- any enum value is outside allowed set
- evidence references are empty
- kill criteria are vague or conditional
- certainty labels are omitted

---

## DEFINITION OF DONE (DOC 3)

- Downstream agents can act **without clarification**
- CEO can approve/reject **without additional research**
- Learning can be written back **unambiguously**

---

**Document 3 complete.**

