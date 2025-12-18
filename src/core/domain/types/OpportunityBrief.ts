export interface OpportunityBriefMeta {
    brief_id: string;
    created_at: string; // ISO format
    created_by: string; // 'ProductResearchAgent'
    research_request_id: string;
    version: number;
    status: 'draft' | 'published' | 'archived';
}

export type Seasonality = 'seasonal' | 'evergreen' | 'hybrid';

export interface OpportunityDefinition {
    theme_name: string;
    category: string;
    seasonality: Seasonality;
    target_geo: string[];
    target_personas: string[];
    use_scenario: string;
}

export type ProblemFrequency = 'one-off' | 'seasonal' | 'recurring';
export type ProblemUrgency = 'low' | 'medium' | 'high';

export interface CustomerProblem {
    problem_statement: string;
    problem_frequency: ProblemFrequency;
    current_solutions: string[];
    problem_urgency: ProblemUrgency;
}

export type SignalType = 'social' | 'search' | 'marketplace' | 'ads' | 'supplier';
export type TrendDirection = 'rising' | 'flat' | 'declining';
export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface DemandEvidence {
    signal_types_used: SignalType[];
    why_now_summary: string;
    demand_trend_direction: TrendDirection;
    demand_velocity_confidence: ConfidenceLevel;
}

export type CompetitionDensity = 'low' | 'medium' | 'high';
export type CompetitionQuality = 'weak' | 'mixed' | 'strong';
export type SaturationRisk = 'low' | 'medium' | 'high';

export interface CompetitionAnalysis {
    competition_density: CompetitionDensity;
    competition_quality: CompetitionQuality;
    dominant_positioning_patterns: string[];
    obvious_gaps: string[];
    saturation_risk: SaturationRisk;
}

export type MarginFeasibility = 'poor' | 'viable' | 'strong';
export type PriceSensitivity = 'low' | 'medium' | 'high';

export interface PricingAndEconomics {
    expected_price_band: {
        min: number;
        max: number;
    };
    margin_feasibility: MarginFeasibility;
    price_sensitivity: PriceSensitivity;
}

export type Complexity = 'low' | 'medium' | 'high';

export interface OfferConcept {
    core_product_hypothesis: string;
    key_attributes: string[];
    bundle_or_upsell_ideas: string[];
    expected_complexity: Complexity;
}

export interface DifferentiationStrategy {
    primary_differentiator: string;
    secondary_differentiators: string[];
    angle_whitespace_summary: string;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskAssessment {
    fulfillment_risk: RiskLevel;
    customer_support_risk: RiskLevel;
    platform_policy_risk: RiskLevel;
    supplier_risk_proxy: RiskLevel;
    known_failure_modes: string[];
}

export type TrendPhase = 'early' | 'mid' | 'late';
export type ExecutionSpeedFit = 'good' | 'tight' | 'poor';

export interface TimeAndCycle {
    trend_phase: TrendPhase;
    estimated_window_weeks: number;
    execution_speed_fit: ExecutionSpeedFit;
}

export type TestType = 'ads' | 'landing_page' | 'preorder' | 'marketplace_probe';

export interface ValidationPlan {
    test_type: TestType;
    test_goal: string;
    max_test_budget: number;
    success_signals: string[];
    data_required_days: number;
}

export interface KillCriteria {
    hard_kill_conditions: string[];
    soft_warning_conditions: string[];
    decision_owner: string;
}

export interface AssumptionsAndCertainty {
    observed_facts: string[];
    inferred_conclusions: string[];
    assumptions_to_validate: string[];
    overall_confidence: ConfidenceLevel;
}

export interface EvidenceReferences {
    evidence_ids: string[];
    signal_source_map: Record<string, string>;
}

// Temporary: Moved from ProductResearchAgent.ts
export interface ProductConcept {
    theme_id: string;
    core_hypothesis: string;
    bundle_options: string[];
    target_persona: string;
    usage_scenario: string;
    differentiation: string;
    supplier_check: 'pass' | 'fail';
}

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
    
    // Legacy fields (to be refactored into schema sections)
    id?: string; // Deprecated in favor of meta.brief_id
    theme_id: string;
    concept: ProductConcept;
    market_evidence: {
        signal_count: number;
        trend_phase: string;
        competitor_saturation: string;
    };
    execution_plan: {
        validation_steps: string[];
        kill_criteria: string[];
    };
    certainty_score: number;
}
