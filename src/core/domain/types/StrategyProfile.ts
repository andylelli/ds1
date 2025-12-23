export interface ScoringConfig {
    weights: {
        demand: number;
        trend: number;
        competition: number;
        risk: number;
    };
}

export interface StrategyProfile {
    risk_tolerance: 'low' | 'medium' | 'high';
    target_margin: number;
    allowed_categories: string[];
    scoring_config?: ScoringConfig;
}

// Default Strategy - Single Source of Truth
export const CurrentStrategy: StrategyProfile = {
    risk_tolerance: 'medium',
    target_margin: 0.30,
    allowed_categories: ['Fitness', 'Home', 'Pet', 'Gadgets', 'General']
};
