# Blueprint: Implementing the Opportunity Brief Schema

## 1. Executive Summary
This document outlines the technical implementation plan for transitioning the `ProductResearchAgent` from returning simple product lists to producing a formal, schema-validated **Opportunity Brief**. This ensures that every product recommendation is backed by evidence, risk assessment, and a clear validation plan.

## 2. Core Objectives
1.  **Formalize Output**: Replace ad-hoc JSON with a strict `OpportunityBrief` structure.
2.  **Enforce Quality**: Use Zod schemas to validate that all required fields (Risk, Competition, Demand) are present before a brief is published.
3.  **Enable Traceability**: Link every conclusion in the brief back to specific MCP signal IDs.
4.  **Prepare for Storage**: Design the database schema to store these complex objects.

---

## 3. Data Structures (TypeScript Interfaces)

We will define these types in `src/core/domain/types/OpportunityBrief.ts`.

### 3.1 Enums
```typescript
export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type TrendPhase = 'early' | 'mid' | 'late';
export type TrendDirection = 'rising' | 'flat' | 'declining';
export type CompetitionDensity = 'low' | 'medium' | 'high';
export type ValidationTestType = 'ads' | 'landing_page' | 'preorder' | 'marketplace_probe';
```

### 3.2 The Main Interface
```typescript
export interface OpportunityBrief {
  // 1. Meta
  meta: {
    brief_id: string; // UUID
    created_at: string; // ISO Date
    created_by: string; // 'ProductResearchAgent'
    research_request_id: string;
    version: number;
    status: 'draft' | 'published' | 'archived';
  };

  // 2. Opportunity Definition
  opportunity_definition: {
    theme_name: string;
    category: string;
    seasonality: 'seasonal' | 'evergreen' | 'hybrid';
    target_geo: string[];
    target_personas: string[];
    use_scenario: string;
  };

  // 3. Customer Problem
  customer_problem: {
    problem_statement: string;
    problem_frequency: 'one-off' | 'seasonal' | 'recurring';
    current_solutions: string[];
    problem_urgency: 'low' | 'medium' | 'high';
  };

  // 4. Demand Evidence
  demand_evidence: {
    signal_types_used: string[]; // ['social', 'search', 'marketplace']
    why_now_summary: string;
    demand_trend_direction: TrendDirection;
    demand_velocity_confidence: ConfidenceLevel;
  };

  // 5. Competition Analysis
  competition_analysis: {
    competition_density: CompetitionDensity;
    competition_quality: 'weak' | 'mixed' | 'strong';
    dominant_positioning_patterns: string[];
    obvious_gaps: string[];
    saturation_risk: 'low' | 'medium' | 'high';
  };

  // 6. Pricing & Economics
  pricing_and_economics: {
    expected_price_band: { min: number; max: number };
    margin_feasibility: 'poor' | 'viable' | 'strong';
    price_sensitivity: 'low' | 'medium' | 'high';
  };

  // 7. Offer Concept
  offer_concept: {
    core_product_hypothesis: string;
    key_attributes: string[];
    bundle_or_upsell_ideas: string[];
    expected_complexity: 'low' | 'medium' | 'high';
  };

  // 8. Differentiation Strategy
  differentiation_strategy: {
    primary_differentiator: string;
    secondary_differentiators: string[];
    angle_whitespace_summary: string;
  };

  // 9. Risk Assessment
  risk_assessment: {
    fulfillment_risk: 'low' | 'medium' | 'high';
    customer_support_risk: 'low' | 'medium' | 'high';
    platform_policy_risk: 'low' | 'medium' | 'high';
    supplier_risk_proxy: 'low' | 'medium' | 'high';
    known_failure_modes: string[];
  };

  // 10. Time & Cycle
  time_and_cycle: {
    trend_phase: TrendPhase;
    estimated_window_weeks: number;
    execution_speed_fit: 'good' | 'tight' | 'poor';
  };

  // 11. Validation Plan
  validation_plan: {
    test_type: ValidationTestType;
    test_goal: string;
    max_test_budget: number;
    success_signals: string[];
    data_required_days: number;
  };

  // 12. Kill Criteria
  kill_criteria: {
    hard_kill_conditions: string[];
    soft_warning_conditions: string[];
    decision_owner: string;
  };

  // 13. Assumptions & Certainty
  assumptions_and_certainty: {
    observed_facts: string[];
    inferred_conclusions: string[];
    assumptions_to_validate: string[];
    overall_confidence: ConfidenceLevel;
  };

  // 14. Evidence References
  evidence_references: {
    evidence_ids: string[];
    signal_source_map: Record<string, string>; // { evidence_id: signal_type }
  };
}
```

---

## 4. Validation Layer (Zod Schema)

We will use `zod` to validate the AI's output at runtime. If the AI generates a malformed brief, the validation layer will catch it and trigger a retry or error.

**File:** `src/core/domain/schemas/OpportunityBriefSchema.ts`

```typescript
import { z } from 'zod';

export const OpportunityBriefSchema = z.object({
  meta: z.object({
    brief_id: z.string().uuid(),
    status: z.enum(['draft', 'published', 'archived']),
    // ... other meta fields
  }),
  opportunity_definition: z.object({
    theme_name: z.string().min(5),
    // ...
  }),
  // ... implement full schema matching the interface
});
```

---

## 5. Database Storage Strategy

The `OpportunityBrief` is a rich document. While we could normalize it into 14 different tables, a **Hybrid Approach** is best for flexibility and query speed.

### 5.1 New Table: `opportunity_briefs`

```sql
CREATE TABLE opportunity_briefs (
    id UUID PRIMARY KEY,
    research_request_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50),
    
    -- Key Queryable Columns (Promoted from JSON)
    theme_name VARCHAR(255),
    category VARCHAR(255),
    overall_confidence VARCHAR(20),
    trend_phase VARCHAR(20),
    
    -- The Full Document
    data JSONB NOT NULL, -- Stores the complete OpportunityBrief object
    
    -- Search Vector (Optional, for full text search)
    search_vector TSVECTOR
);

CREATE INDEX idx_briefs_category ON opportunity_briefs(category);
CREATE INDEX idx_briefs_status ON opportunity_briefs(status);
CREATE INDEX idx_briefs_data ON opportunity_briefs USING GIN (data);
```

---

## 6. Integration Plan

### Phase 1: Type Definition & Schema Creation
1.  Create `src/core/domain/types/OpportunityBrief.ts`.
2.  Create `src/core/domain/schemas/OpportunityBriefSchema.ts` (Zod).

### Phase 2: Database Migration
1.  Create the `opportunity_briefs` table in Postgres.
2.  Update `PostgresAdapter` to include `saveOpportunityBrief(brief: OpportunityBrief)` and `getOpportunityBrief(id: string)`.

### Phase 3: Agent Logic Update (`ProductResearchAgent.ts`)
1.  **Modify `findWinningProducts`**:
    *   Instead of returning `{ products: [] }`, it should instantiate a `BriefBuilder`.
    *   It needs to call the AI with a specific prompt: *"Based on the gathered signals, generate a JSON object matching this schema..."*
2.  **Implement `BriefBuilder` Helper**:
    *   A class that aggregates signals from BigQuery (and future sources).
    *   Uses `OpenAIService` to synthesize the narrative sections (Why Now, Risks, etc.).
    *   Validates the result against `OpportunityBriefSchema`.

### Phase 4: Downstream Consumption
1.  Update `SimulationService` to handle the new `OpportunityBrief` object.
2.  Update the UI (`infra.html` / `agents.html`) to display the rich brief instead of a simple product card.

---

## 7. Example AI Prompt for Brief Generation

```text
You are the Product Research Agent.
I have collected the following signals:
- BigQuery Trend: "Smart Kitchen" (Rising, Score 85)
- Competitor Analysis: "Saturated market for blenders"

Generate a valid OpportunityBrief JSON object for a "Smart Herb Garden".
Ensure you populate ALL required fields, including specific kill criteria and risk assessments.
Strictly follow the JSON schema provided.
```
