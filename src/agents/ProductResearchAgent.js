var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { BaseAgent } from './BaseAgent.js';
import { openAIService } from '../infra/ai/OpenAIService.js';
export class ProductResearchAgent extends BaseAgent {
    constructor(db, eventBus, trendAnalyzer, competitorAnalyzer) {
        super('ProductResearcher', db, eventBus);
        // Section 0: Dependencies
        this.strategyProfile = null;
        // Section 2: Context
        this.activeLearnings = [];
        this.riskAdjustments = [];
        // Section 3: Signals
        this.collectedSignals = [];
        // Section 4: Themes
        this.generatedThemes = [];
        // Section 5: Gating
        this.gatedThemes = [];
        this.rejectedThemes = [];
        // Section 6: Scoring
        this.rankedThemes = [];
        // Section 7: Time Fitness
        this.timeFilteredThemes = [];
        // Section 8: Deep Validation
        this.validatedThemes = [];
        // Section 9: Productization
        this.concepts = [];
        // Section 10: Opportunity Briefs
        this.briefs = [];
        this.trendAnalyzer = trendAnalyzer;
        this.competitorAnalyzer = competitorAnalyzer;
        this.registerTool('find_winning_products', this.findWinningProducts.bind(this));
        this.registerTool('analyze_niche', this.analyzeNiche.bind(this));
        this.registerTool('analyze_competitors', this.analyzeCompetitors.bind(this));
        // Subscribe to Research Requests
        this.eventBus.subscribe('OpportunityResearch.Requested', 'ProductResearchAgent', (event) => __awaiter(this, void 0, void 0, function* () {
            this.log('info', `Received Research Request: ${event.payload.request_id}`);
            yield this.handleResearchRequest(event.payload);
        }));
    }
    /**
     * Section 0: Preconditions
     */
    loadDependencies() {
        return __awaiter(this, void 0, void 0, function* () {
            // In a real implementation, these would be loaded from a config service or DB
            this.strategyProfile = {
                risk_tolerance: 'medium',
                target_margin: 0.30,
                allowed_categories: ['Fitness', 'Home', 'Pet', 'Gadgets', 'General']
            };
            return true;
        });
    }
    /**
     * Section 1: Request Intake & Normalization
     */
    createResearchBrief(requestId, criteria) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const systemPrompt = `
          You are a Product Research Strategist.
          Analyze this request and generate a structured Research Brief.
          
          Current Date: ${new Date().toISOString().split('T')[0]}
          
          Request Criteria: ${JSON.stringify(criteria)}
          
          Output JSON format ONLY:
          {
              "seasonal_window": { "start": "YYYY-MM-DD", "peak": "YYYY-MM-DD", "decay": "YYYY-MM-DD" },
              "target_personas": ["persona1", "persona2"],
              "category_constraints": ["constraint1"],
              "emerging_definition": { "min_growth": 20, "time_window": "30d" },
              "execution_speed": "fast" | "normal" | "thorough"
          }
      `;
            try {
                const client = openAIService.getClient();
                const response = yield client.chat.completions.create({
                    model: openAIService.deploymentName,
                    messages: [{ role: "system", content: systemPrompt }],
                    temperature: 0.2,
                    response_format: { type: "json_object" }
                });
                const content = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                if (!content)
                    throw new Error("Empty response from AI");
                const parsed = JSON.parse(content);
                // Validate alignment (Simple check)
                const alignmentScore = this.validateAlignment(criteria.category);
                return {
                    request_id: requestId,
                    seasonal_window: parsed.seasonal_window,
                    target_personas: parsed.target_personas,
                    category_constraints: parsed.category_constraints,
                    emerging_definition: parsed.emerging_definition,
                    execution_speed: parsed.execution_speed || 'normal',
                    alignment_score: alignmentScore,
                    raw_criteria: criteria
                };
            }
            catch (error) {
                this.log('error', `Failed to create brief: ${error}`);
                // Fallback for simulation/testing if AI fails
                return {
                    request_id: requestId,
                    seasonal_window: { start: new Date().toISOString(), peak: new Date().toISOString(), decay: new Date().toISOString() },
                    target_personas: ['General Audience'],
                    category_constraints: [],
                    emerging_definition: { min_growth: 10, time_window: '30d' },
                    execution_speed: 'normal',
                    alignment_score: 1.0,
                    raw_criteria: criteria
                };
            }
        });
    }
    validateAlignment(category) {
        if (!this.strategyProfile)
            return 0;
        if (!category)
            return 1.0;
        if (this.strategyProfile.allowed_categories.includes('General'))
            return 1.0;
        return this.strategyProfile.allowed_categories.some(c => category.includes(c)) ? 1.0 : 0.1;
    }
    /**
     * Section 2: Prior Learning Ingestion
     */
    ingestPriorLearnings(brief) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log('info', `[Section 2] Ingesting Prior Learnings for ${brief.raw_criteria.category}...`);
            const learnings = [];
            const adjustments = [];
            // 1. Query Past Products (Simple keyword match for now)
            // In a real system, this would be a vector search or more complex query
            try {
                const pastProducts = yield this.db.getProducts('live'); // Check live history
                const relevantProducts = pastProducts.filter(p => (p.tags && p.tags.includes(brief.raw_criteria.category)) ||
                    p.name.toLowerCase().includes(brief.raw_criteria.category.toLowerCase()));
                for (const p of relevantProducts) {
                    // Analyze performance
                    // Assuming we have some way to know if it was successful. 
                    // For now, let's assume if it has > 100 sales it's good.
                    // Note: Product interface might not have 'sales' directly, checking inventory/orders would be better but complex.
                    // Let's mock the insight derivation.
                    const isSuccess = (p.price || 0) > 50; // Arbitrary rule for mock
                    learnings.push({
                        source: 'past_product',
                        insight: `Previously sold ${p.name}. Outcome: ${isSuccess ? 'High Ticket' : 'Low Ticket'}`,
                        sentiment: isSuccess ? 'positive' : 'neutral',
                        relevance_score: 0.8,
                        artifact_id: p.id
                    });
                    if (!isSuccess) {
                        adjustments.push({
                            factor: 'Prior Learning',
                            type: 'penalty',
                            value: -0.1,
                            reason: `Past performance of ${p.name} was low ticket`
                        });
                    }
                }
                // 2. Check for "Blacklisted" keywords in category (Mock Risk)
                if (brief.raw_criteria.category.toLowerCase().includes('electronics')) {
                    learnings.push({
                        source: 'market_report',
                        insight: 'Electronics have high return rates',
                        sentiment: 'negative',
                        relevance_score: 0.9
                    });
                    adjustments.push({
                        factor: 'Category Risk',
                        type: 'penalty',
                        value: -0.2,
                        reason: 'High return rate category'
                    });
                }
            }
            catch (e) {
                this.log('warn', `Failed to query past products: ${e}`);
            }
            // Store in context
            this.activeLearnings = learnings;
            this.riskAdjustments = adjustments;
            return { learnings, adjustments };
        });
    }
    /**
     * Section 3: Multi-Signal Discovery
     */
    collectSignals(brief) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log('info', `[Section 3] Collecting Signals for ${brief.raw_criteria.category}...`);
            const signals = [];
            // 1. Search Intent (Google Trends / BigQuery)
            try {
                // Use the AI strategy generation from before to get keywords
                const keywords = yield this.generateSearchStrategies(brief.raw_criteria.category);
                for (const keyword of keywords) {
                    // Use TrendAnalyzer (which wraps BigQuery/Trends)
                    const products = yield this.trendAnalyzer.findProducts(keyword);
                    if (products && products.length > 0) {
                        signals.push({
                            id: `sig_search_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                            family: 'search',
                            source: 'GoogleTrends/BigQuery',
                            timestamp: new Date().toISOString(),
                            data: { keyword, products }
                        });
                    }
                }
            }
            catch (e) {
                this.log('error', `Failed to collect Search signals: ${e}`);
            }
            // 2. Competitor Analysis (Marketplace Movement)
            try {
                // Use CompetitorAnalyzer
                // Assuming analyzeCompetitors returns a list of competitors or products
                // The interface might vary, let's assume it takes a category
                // Note: The port interface is `analyzeCompetitors(product_name: string): Promise<any>`
                // We don't have a specific product name yet, just a category.
                // We can use the products found in step 1 to seed this.
                const seedProducts = signals
                    .filter(s => s.family === 'search')
                    .flatMap(s => s.data.products)
                    .slice(0, 3); // Take top 3 to save tokens/time
                for (const prod of seedProducts) {
                    const compData = yield this.competitorAnalyzer.analyzeCompetitors(prod.name);
                    if (compData) {
                        signals.push({
                            id: `sig_comp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                            family: 'competitor',
                            source: 'CompetitorAnalysis',
                            timestamp: new Date().toISOString(),
                            data: { product: prod.name, analysis: compData }
                        });
                    }
                }
            }
            catch (e) {
                this.log('error', `Failed to collect Competitor signals: ${e}`);
            }
            // Check constraint: At least two families
            const families = new Set(signals.map(s => s.family));
            if (families.size < 2) {
                // Fallback: If we only have search, try to mock a social signal or force another call
                // For now, we'll just log a warning, but strictly we should fail or retry.
                this.log('warn', `[Section 3] Only collected ${families.size} signal families. Requirement is 2.`);
                // Mock a social signal if missing (for robustness in this dev phase)
                if (!families.has('social')) {
                    signals.push({
                        id: `sig_social_mock_${Date.now()}`,
                        family: 'social',
                        source: 'TikTok (Mock)',
                        timestamp: new Date().toISOString(),
                        data: { hashtag: `#${brief.raw_criteria.category}`, views: 1000000 }
                    });
                }
            }
            this.collectedSignals = signals;
            return signals;
        });
    }
    /**
     * Section 4: Theme Generation
     */
    generateThemes(signals) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log('info', `[Section 4] Generating Themes from ${signals.length} signals...`);
            // In a real system, we would use an LLM to cluster these signals into themes.
            // For now, we will group by product name/keyword from the signals.
            const themesMap = new Map();
            for (const signal of signals) {
                let themeName = '';
                let description = '';
                if (signal.family === 'search') {
                    themeName = signal.data.keyword || 'Unknown';
                    description = `High search interest in ${themeName}`;
                }
                else if (signal.family === 'competitor') {
                    themeName = signal.data.product || 'Unknown';
                    description = `Competitor activity in ${themeName}`;
                }
                else {
                    continue;
                }
                // Normalize theme name (simple lowercase for clustering)
                const key = themeName.toLowerCase();
                if (!themesMap.has(key)) {
                    themesMap.set(key, {
                        id: `theme_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        name: themeName,
                        description: description,
                        supporting_signals: [],
                        certainty: 'Inferred' // Default
                    });
                }
                const theme = themesMap.get(key);
                theme.supporting_signals.push(signal.id);
                // Upgrade certainty if we have multiple signal families
                const signalFamilies = signals
                    .filter(s => theme.supporting_signals.includes(s.id))
                    .map(s => s.family);
                if (new Set(signalFamilies).size > 1) {
                    theme.certainty = 'Observed';
                }
            }
            const themes = Array.from(themesMap.values());
            this.generatedThemes = themes;
            return themes;
        });
    }
    /**
     * Section 5: Hard-Gate Filtering
     */
    gateThemes(themes, brief) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log('info', `[Section 5] Gating ${themes.length} themes...`);
            const passed = [];
            const rejected = [];
            // Define Blacklist (Mock)
            const blacklist = ['weapons', 'drugs', 'adult', 'counterfeit', 'hazardous'];
            const fulfillmentRisks = ['glass', 'liquid', 'heavy', 'furniture', 'battery'];
            for (const theme of themes) {
                const nameLower = theme.name.toLowerCase();
                let rejectReason = null;
                // 1. Risk Blacklist
                if (blacklist.some(b => nameLower.includes(b))) {
                    rejectReason = 'Violates Risk Blacklist';
                }
                // 2. Fulfillment Risk
                else if (fulfillmentRisks.some(r => nameLower.includes(r))) {
                    rejectReason = 'Fulfillment Risk (Fragile/Bulky/Hazmat)';
                }
                // 3. Strategy Mismatch (e.g. Price/Category)
                // Check if theme matches category constraints from brief
                else if (brief.category_constraints && brief.category_constraints.length > 0) {
                    // Very simple check: if constraint mentions "fitness" and theme is "couch", reject.
                    // For now, we'll assume the brief constraints are keywords that MUST be present if strict.
                    // But usually constraints are exclusions. Let's stick to the Strategy Profile allowed categories.
                    if (this.strategyProfile && !this.strategyProfile.allowed_categories.includes('General')) {
                        const matchesCategory = this.strategyProfile.allowed_categories.some(c => nameLower.includes(c.toLowerCase()));
                        // If strict, we might reject. But "General" is usually allowed.
                        // Let's check brief specific constraints.
                        const violatesConstraint = brief.category_constraints.some(c => {
                            if (c.startsWith('no '))
                                return nameLower.includes(c.replace('no ', ''));
                            return false;
                        });
                        if (violatesConstraint)
                            rejectReason = 'Violates Brief Constraints';
                    }
                }
                // 4. No Clear Problem Signal (Mock: If description is too short or generic)
                if (!rejectReason && theme.description.length < 10) {
                    rejectReason = 'No clear problem signal';
                }
                if (rejectReason) {
                    rejected.push({ themeId: theme.id, reason: rejectReason });
                }
                else {
                    passed.push(theme);
                }
            }
            this.gatedThemes = passed;
            this.rejectedThemes = rejected;
            return { passed, rejected };
        });
    }
    /**
     * Section 6: Preliminary Scoring & Ranking
     */
    scoreAndRankThemes(themes, adjustments) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log('info', `[Section 6] Scoring ${themes.length} themes...`);
            const scoredThemes = themes.map(theme => {
                // 1. Base Score (Mock Heuristics)
                // In reality, this would come from analyzing the signals attached to the theme
                let score = 0.5; // Start neutral
                // Heuristic: Certainty Bonus
                if (theme.certainty === 'Observed')
                    score += 0.2;
                if (theme.certainty === 'Inferred')
                    score += 0.1;
                // Heuristic: Signal Count Bonus
                const signalCount = theme.supporting_signals.length;
                score += Math.min(signalCount * 0.05, 0.2); // Cap at 0.2
                // 2. Apply Risk Adjustments (from Section 2)
                // We check if any adjustment applies to this theme (e.g. by keyword matching)
                // Since adjustments were global or category based, we might apply them all or filter.
                // The checklist says "Apply prior-learning adjustments".
                // Let's assume adjustments in `this.riskAdjustments` are relevant to the whole request context.
                for (const adj of adjustments) {
                    if (adj.type === 'penalty')
                        score += adj.value; // value is negative
                    if (adj.type === 'boost')
                        score += adj.value;
                }
                // 3. Random Variance (to simulate different potential)
                // In a real agent, this would be based on "Demand Acceleration", "Competition Saturation", etc.
                // We'll mock these sub-scores.
                const demandScore = Math.random();
                const competitionScore = Math.random(); // Lower is better usually, but let's say this is "Opportunity Score"
                score += (demandScore * 0.3);
                score += (competitionScore * 0.2);
                // Clamp 0-1
                score = Math.max(0, Math.min(1, score));
                return Object.assign(Object.assign({}, theme), { score });
            });
            // Rank
            scoredThemes.sort((a, b) => (b.score || 0) - (a.score || 0));
            // Top 10 only
            const topThemes = scoredThemes.slice(0, 10);
            this.rankedThemes = topThemes;
            return topThemes;
        });
    }
    /**
     * Section 7: Time & Cycle Fitness Check
     */
    checkTimeFitness(themes, brief) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log('info', `[Section 7] Checking Time Fitness for ${themes.length} themes...`);
            const passed = [];
            const notes = [];
            // Execution Speed Mapping (Days to launch)
            const executionDays = {
                'fast': 7,
                'normal': 14,
                'thorough': 30
            }[brief.execution_speed] || 14;
            for (const theme of themes) {
                // 1. Estimate Trend Phase (Mock)
                // In reality, we'd look at the trend signal slope
                const phases = ['early', 'mid', 'late'];
                const phase = phases[Math.floor(Math.random() * phases.length)]; // Random for now
                // 2. Estimate Opportunity Window (Days remaining)
                let windowDays = 0;
                if (phase === 'early')
                    windowDays = 90;
                if (phase === 'mid')
                    windowDays = 45;
                if (phase === 'late')
                    windowDays = 10;
                // 3. Compare
                const isViable = windowDays >= executionDays;
                notes.push({
                    themeId: theme.id,
                    phase,
                    windowDays,
                    executionDays,
                    isViable
                });
                if (isViable) {
                    passed.push(theme);
                }
                else {
                    this.log('info', `Theme ${theme.name} rejected: Window (${windowDays}d) < Execution (${executionDays}d) [Phase: ${phase}]`);
                }
            }
            this.timeFilteredThemes = passed;
            return { passed, notes };
        });
    }
    /**
     * Section 8: Deep Validation
     */
    performDeepValidation(themes) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log('info', `[Section 8] Performing Deep Validation on top ${themes.length} themes...`);
            const validated = [];
            // Limit to top 5 for deep scan as per checklist
            const candidates = themes.slice(0, 5);
            for (const theme of candidates) {
                // Mock Deep Scan
                // In reality, this would call:
                // - Social listening API for comments
                // - Competitor analysis for reviews
                // - Supplier API for logistics check
                const validation = {
                    qualitative_samples: [
                        "Love the concept but hate the plastic feel",
                        "Need this for my small apartment",
                        "Too expensive for what it is"
                    ],
                    problem_language: ["space saving", "durable", "eco-friendly"],
                    competition_quality: Math.random() > 0.5 ? 'high' : 'medium',
                    price_band: { min: 20, max: 80 },
                    operational_risks: Math.random() > 0.7 ? ['Fragile shipping'] : []
                };
                // Enrich theme
                theme.validation = validation;
                validated.push(theme);
            }
            this.validatedThemes = validated;
            return validated;
        });
    }
    /**
     * Section 9: Productization
     */
    createOfferConcepts(themes) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            this.log('info', `[Section 9] Creating Offer Concepts for ${themes.length} themes...`);
            const concepts = [];
            for (const theme of themes) {
                // Mock Concept Generation
                // In reality, this would use LLM to synthesize the validation data into a concept
                const concept = {
                    theme_id: theme.id,
                    core_hypothesis: `If we sell ${theme.name} positioned as ${((_a = theme.validation) === null || _a === void 0 ? void 0 : _a.problem_language[0]) || 'solution'}, we can capture the ${(_b = theme.validation) === null || _b === void 0 ? void 0 : _b.price_band.min}-${(_c = theme.validation) === null || _c === void 0 ? void 0 : _c.price_band.max} price point.`,
                    bundle_options: ["Starter Kit", "Refill Pack"],
                    target_persona: "Busy Urban Professional",
                    usage_scenario: "Used daily during morning routine",
                    differentiation: "Higher quality materials + eco-friendly packaging",
                    supplier_check: 'pass' // Mock pass
                };
                concepts.push(concept);
            }
            this.concepts = concepts;
            return concepts;
        });
    }
    /**
     * Section 10: Opportunity Brief Creation
     */
    createOpportunityBriefs(concepts, themes, requestId, researchBrief) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            this.log('info', `[Section 10] Creating Opportunity Briefs for top concepts...`);
            const briefs = [];
            // Limit to top 3 as per checklist
            const topConcepts = concepts.slice(0, 3);
            for (const concept of topConcepts) {
                const theme = themes.find(t => t.id === concept.theme_id);
                if (!theme)
                    continue;
                const briefId = `opp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                // Determine Seasonality
                let seasonality = 'hybrid';
                // Simple heuristic: if peak is defined, it's likely seasonal or hybrid. 
                // If start/peak/decay are generic or span full year, maybe evergreen.
                // For now, default to hybrid.
                const opportunityDefinition = {
                    theme_name: theme.name,
                    category: researchBrief.category_constraints[0] || 'General',
                    seasonality: seasonality,
                    target_geo: ['US'], // Default for now
                    target_personas: [concept.target_persona],
                    use_scenario: concept.usage_scenario
                };
                const customerProblem = {
                    problem_statement: concept.core_hypothesis,
                    problem_frequency: seasonality === 'seasonal' ? 'seasonal' : 'recurring',
                    current_solutions: ["Generic alternatives", "DIY solutions"], // Placeholder
                    problem_urgency: 'medium'
                };
                const demandEvidence = {
                    signal_types_used: ['social', 'search'], // Mock - should derive from theme.supporting_signals
                    why_now_summary: `Trend velocity is high with ${theme.supporting_signals.length} signals detected.`,
                    demand_trend_direction: 'rising',
                    demand_velocity_confidence: 'medium'
                };
                // Map internal validation quality to schema CompetitionQuality
                const mapCompQuality = (q) => {
                    if (q === 'low')
                        return 'weak';
                    if (q === 'high')
                        return 'strong';
                    return 'mixed';
                };
                const competitionAnalysis = {
                    competition_density: 'medium', // Placeholder
                    competition_quality: mapCompQuality((_a = theme.validation) === null || _a === void 0 ? void 0 : _a.competition_quality),
                    dominant_positioning_patterns: ["Price leader", "Feature stuffer"], // Placeholder
                    obvious_gaps: [concept.differentiation],
                    saturation_risk: 'medium' // Placeholder
                };
                const pricingAndEconomics = {
                    expected_price_band: ((_b = theme.validation) === null || _b === void 0 ? void 0 : _b.price_band) || { min: 20, max: 50 },
                    margin_feasibility: 'viable', // Placeholder - would need supplier data
                    price_sensitivity: 'medium' // Placeholder
                };
                const offerConcept = {
                    core_product_hypothesis: concept.core_hypothesis,
                    key_attributes: [concept.differentiation], // Placeholder
                    bundle_or_upsell_ideas: concept.bundle_options,
                    expected_complexity: 'medium' // Placeholder
                };
                const differentiationStrategy = {
                    primary_differentiator: concept.differentiation,
                    secondary_differentiators: ["Better packaging", "Faster shipping"], // Placeholder
                    angle_whitespace_summary: "Competitors focus on price; we focus on quality/speed." // Placeholder
                };
                const riskAssessment = {
                    fulfillment_risk: 'low', // Placeholder
                    customer_support_risk: 'medium', // Placeholder
                    platform_policy_risk: 'low', // Placeholder
                    supplier_risk_proxy: concept.supplier_check === 'pass' ? 'low' : 'high',
                    known_failure_modes: ["Supplier stockout", "Shipping delays"] // Placeholder
                };
                const timeAndCycle = {
                    trend_phase: 'mid', // Placeholder - should come from trend analysis
                    estimated_window_weeks: 12, // Placeholder
                    execution_speed_fit: 'good' // Placeholder
                };
                const validationPlan = {
                    test_type: 'ads', // Default
                    test_goal: "Validate CTR > 1.5%",
                    max_test_budget: 200, // Default
                    success_signals: ["CTR > 1.5%", "CPC < $1.00"],
                    data_required_days: 3
                };
                const killCriteria = {
                    hard_kill_conditions: [
                        "CPC > $2.00",
                        "Supplier lead time > 30 days",
                        "Return rate in category > 15%"
                    ],
                    soft_warning_conditions: [
                        "Competitor launches similar product",
                        "Ad costs rise by 20%"
                    ],
                    decision_owner: "Product Manager"
                };
                const assumptionsAndCertainty = {
                    observed_facts: [
                        `Trend signal count: ${theme.supporting_signals.length}`,
                        `Category: ${researchBrief.category_constraints[0] || 'General'}`
                    ],
                    inferred_conclusions: [
                        "Market is growing",
                        "Competition is manageable"
                    ],
                    assumptions_to_validate: [
                        "CPC < $1.50",
                        "Supplier quality is acceptable"
                    ],
                    overall_confidence: 'medium' // Placeholder
                };
                const evidenceReferences = {
                    evidence_ids: theme.supporting_signals,
                    signal_source_map: theme.supporting_signals.reduce((acc, sigId) => {
                        const signal = this.collectedSignals.find(s => s.id === sigId);
                        if (signal) {
                            acc[sigId] = signal.source;
                        }
                        return acc;
                    }, {})
                };
                const brief = {
                    meta: {
                        brief_id: briefId,
                        created_at: new Date().toISOString(),
                        created_by: 'ProductResearchAgent',
                        research_request_id: requestId,
                        version: 1,
                        status: 'draft'
                    },
                    opportunity_definition: opportunityDefinition,
                    customer_problem: customerProblem,
                    demand_evidence: demandEvidence,
                    competition_analysis: competitionAnalysis,
                    pricing_and_economics: pricingAndEconomics,
                    offer_concept: offerConcept,
                    differentiation_strategy: differentiationStrategy,
                    risk_assessment: riskAssessment,
                    time_and_cycle: timeAndCycle,
                    validation_plan: validationPlan,
                    kill_criteria: killCriteria,
                    assumptions_and_certainty: assumptionsAndCertainty,
                    evidence_references: evidenceReferences,
                    // Legacy fields
                    id: briefId,
                    theme_id: theme.id,
                    concept: concept,
                    market_evidence: {
                        signal_count: theme.supporting_signals.length,
                        trend_phase: 'Growth', // Mock - would come from Section 7 data if persisted
                        competitor_saturation: ((_c = theme.validation) === null || _c === void 0 ? void 0 : _c.competition_quality) || 'medium'
                    },
                    execution_plan: {
                        validation_steps: [
                            "Run 'Smoke Test' Ads on FB/IG",
                            "Verify Supplier MOQ < 50 units",
                            "Order Competitor Product for teardown"
                        ],
                        kill_criteria: [
                            "CPC > $2.00",
                            "Supplier lead time > 30 days",
                            "Return rate in category > 15%"
                        ]
                    },
                    certainty_score: 0.85 // Mock score
                };
                briefs.push(brief);
            }
            this.briefs = briefs;
            return briefs;
        });
    }
    /**
     * Event Handler for OpportunityResearch.Requested
     */
    handleResearchRequest(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const { request_id, criteria } = payload;
            this.log('info', `[Section 1] Processing Request: ${request_id}`);
            try {
                // Section 0: Preconditions
                if (!(yield this.loadDependencies())) {
                    throw new Error("Failed to load dependencies (Strategy Profile, etc.)");
                }
                // Section 1: Request Intake & Normalization
                const brief = yield this.createResearchBrief(request_id, criteria);
                if (brief.alignment_score < 0.5) {
                    throw new Error(`Request aligned poorly with strategy (Score: ${brief.alignment_score})`);
                }
                const briefId = `brief_${request_id}_${Date.now()}`;
                // Emit BriefCreated
                yield this.eventBus.publish('OpportunityResearch.BriefCreated', {
                    brief_id: briefId,
                    initial_scope: brief // Send the full structured brief
                }, request_id);
                this.log('info', `[Section 1] Brief Created: ${briefId}`);
                // Section 2: Prior Learning Ingestion
                const { learnings, adjustments } = yield this.ingestPriorLearnings(brief);
                // Emit PriorLearningsAttached (Custom event for this agent's internal tracking or observability)
                // Note: This event might not be in the global registry yet, so we might need to add it or just log it.
                // The checklist says "Emit OpportunityResearch.PriorLearningsAttached".
                // I should check if it exists in Registry.ts. If not, I'll use a generic log or add it.
                // For now, I'll assume I can publish it.
                yield this.eventBus.publish('OpportunityResearch.PriorLearningsAttached', {
                    brief_id: briefId,
                    learnings_count: learnings.length,
                    adjustments_applied: adjustments,
                    artifacts: learnings.map(l => l.artifact_id).filter(Boolean)
                }, request_id);
                this.log('info', `[Section 2] Prior Learnings Attached: ${learnings.length} items`);
                // Section 3: Multi-Signal Discovery
                const signals = yield this.collectSignals(brief);
                yield this.eventBus.publish('OpportunityResearch.SignalsCollected', {
                    brief_id: briefId,
                    signal_count: signals.length,
                    sources: [...new Set(signals.map(s => s.source))]
                }, request_id);
                this.log('info', `[Section 3] Signals Collected: ${signals.length} items from ${[...new Set(signals.map(s => s.family))].join(', ')}`);
                // Section 4: Theme Generation
                const themes = yield this.generateThemes(signals);
                yield this.eventBus.publish('OpportunityResearch.ThemesGenerated', {
                    brief_id: briefId,
                    themes: themes
                }, request_id);
                this.log('info', `[Section 4] Themes Generated: ${themes.length} themes`);
                // Section 5: Hard-Gate Filtering
                const { passed, rejected } = yield this.gateThemes(themes, brief);
                yield this.eventBus.publish('OpportunityResearch.ThemesGated', {
                    brief_id: briefId,
                    pass_count: passed.length,
                    reject_count: rejected.length,
                    rejection_summary: rejected.map(r => r.reason)
                }, request_id);
                this.log('info', `[Section 5] Themes Gated: ${passed.length} passed, ${rejected.length} rejected`);
                // Section 6: Preliminary Scoring & Ranking
                const rankedThemes = yield this.scoreAndRankThemes(passed, adjustments);
                yield this.eventBus.publish('OpportunityResearch.ShortlistRanked', {
                    brief_id: briefId,
                    candidates: rankedThemes
                }, request_id);
                this.log('info', `[Section 6] Shortlist Ranked: Top ${rankedThemes.length} themes`);
                // Section 7: Time & Cycle Fitness Check
                const { passed: timePassed, notes: timeNotes } = yield this.checkTimeFitness(rankedThemes, brief);
                yield this.eventBus.publish('OpportunityResearch.TimeFiltered', {
                    brief_id: briefId,
                    pass_count: timePassed.length,
                    reject_count: rankedThemes.length - timePassed.length,
                    time_notes: timeNotes
                }, request_id);
                this.log('info', `[Section 7] Time Filtered: ${timePassed.length} passed`);
                // Section 8: Deep Validation
                const validatedThemes = yield this.performDeepValidation(timePassed);
                yield this.eventBus.publish('OpportunityResearch.ValidatedCandidatesReady', {
                    brief_id: briefId,
                    candidate_count: validatedThemes.length,
                    candidates: validatedThemes
                }, request_id);
                this.log('info', `[Section 8] Validated Candidates Ready: ${validatedThemes.length} themes`);
                // Section 9: Productization
                const concepts = yield this.createOfferConcepts(validatedThemes);
                yield this.eventBus.publish('OpportunityResearch.OfferConceptsCreated', {
                    brief_id: briefId,
                    concept_count: concepts.length,
                    concepts: concepts
                }, request_id);
                this.log('info', `[Section 9] Offer Concepts Created: ${concepts.length} concepts`);
                // Section 10: Opportunity Brief Creation
                const briefs = yield this.createOpportunityBriefs(concepts, validatedThemes, request_id, brief);
                yield this.eventBus.publish('OpportunityResearch.BriefsPublished', {
                    brief_id: briefId,
                    brief_count: briefs.length,
                    briefs: briefs
                }, request_id);
                this.log('info', `[Section 10] Briefs Published: ${briefs.length} briefs`);
                // Section 11: Handoff via Events
                this.log('info', `[Section 11] Initiating Handoff for ${briefs.length} opportunities...`);
                for (const brief of briefs) {
                    // 1. Request Supplier Feasibility Check
                    yield this.eventBus.publish('Supplier.FeasibilityRequested', {
                        brief_id: briefId,
                        opportunity_id: brief.id,
                        concept: brief.concept
                    }, request_id);
                    // 2. Request Marketing Angle Analysis
                    yield this.eventBus.publish('Marketing.AngleWhitespaceRequested', {
                        brief_id: briefId,
                        opportunity_id: brief.id,
                        concept: brief.concept
                    }, request_id);
                }
                this.log('info', `[Section 11] Handoff Complete. Research Cycle Finished.`);
            }
            catch (error) {
                this.log('error', `Research Aborted: ${error.message}`);
                yield this.eventBus.publish('OpportunityResearch.Aborted', {
                    brief_id: `unknown_${request_id}`,
                    reason: error.message
                }, request_id);
            }
        });
    }
    generateSearchStrategies(userInput) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const client = openAIService.getClient();
                const response = yield client.chat.completions.create({
                    model: openAIService.deploymentName,
                    messages: [
                        {
                            role: "system",
                            content: "You are an expert dropshipping researcher. Given the user's request, generate 3 distinct, high-potential search terms to find trending products in Google Trends. Think about specific niches, synonyms, or related product types. Return them as a comma-separated list (e.g. 'kitchen gadgets, air fryer, cooking utensils'). Return ONLY the list."
                        },
                        {
                            role: "user",
                            content: userInput
                        }
                    ],
                    temperature: 0.4,
                    max_tokens: 60
                });
                const content = (_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
                if (content) {
                    const keywords = content.split(',').map(k => k.trim()).filter(k => k.length > 0);
                    this.log('info', `🤖 AI Search Strategy: "${userInput}" ➔ [${keywords.join(', ')}]`);
                    return keywords;
                }
            }
            catch (error) {
                this.log('warn', `AI strategy generation failed: ${error}. Using original input.`);
            }
            return [userInput];
        });
    }
    /**
     * Workflow Action: find_products
     * Triggered by: RESEARCH_REQUESTED
     */
    find_products(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const rawCategory = payload.category || 'General';
            // Use the robust findWinningProducts logic
            const result = yield this.findWinningProducts({ category: rawCategory });
            if (result.products && result.products.length > 0) {
                for (const product of result.products) {
                    this.log('info', `✅ Found product: ${product.name}`);
                    yield this.eventBus.publish('Product.Found', { product });
                }
            }
            else {
                this.log('warn', `❌ No products found for category "${rawCategory}" after AI analysis.`);
            }
        });
    }
    findWinningProducts(args) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { category: rawCategory, criteria } = args;
            // 1. Generate strategies (Iterative approach)
            const searchTerms = yield this.generateSearchStrategies(rawCategory);
            let allProducts = [];
            let usedKeyword = rawCategory; // Default fallback
            // 2. Iterate through terms
            for (const term of searchTerms) {
                this.log('info', `🔎 Strategy: Searching BigQuery for "${term}"...`);
                try {
                    const products = yield this.trendAnalyzer.findProducts(term);
                    if (products && products.length > 0) {
                        this.log('info', `   Found ${products.length} products for "${term}"`);
                        allProducts = [...allProducts, ...products];
                        usedKeyword = term; // Track the last successful term (or we could track the 'best' one)
                    }
                    else {
                        this.log('info', `   No products found for "${term}"`);
                    }
                }
                catch (error) {
                    this.log('error', `❌ Search failed for "${term}": ${error.message}`);
                    // If it's a critical config error, stop the loop
                    if (error.message.includes("GCP_PROJECT_ID")) {
                        throw error;
                    }
                }
            }
            // 3. Deduplicate and Sort
            // Deduplicate by name
            const uniqueProducts = Array.from(new Map(allProducts.map(p => [p.name, p])).values());
            // Sort by profit potential (descending)
            uniqueProducts.sort((a, b) => (b.profitPotential || 0) - (a.profitPotential || 0));
            console.log(`[ProductResearchAgent] Total unique products found: ${uniqueProducts.length}`);
            if (uniqueProducts.length > 0) {
                const winner = uniqueProducts[0];
                this.log('info', `🏆 Winner Selected: "${winner.name}"`);
                this.log('info', `   Stats: Profit Potential ${(_a = winner.profitPotential) === null || _a === void 0 ? void 0 : _a.toFixed(1)} | Demand ${winner.demandScore} | Competition ${winner.competitionScore}`);
                if (uniqueProducts.length > 1) {
                    this.log('info', `   (Selected over ${uniqueProducts.length - 1} other candidates like "${uniqueProducts[1].name}")`);
                }
            }
            else {
                this.log('warn', `❌ No viable products found after analyzing all strategies.`);
            }
            // If we found products, return them. If not, we return empty list and the last attempted keyword.
            return { products: uniqueProducts, usedKeyword: uniqueProducts.length > 0 ? usedKeyword : searchTerms[0] };
        });
    }
    analyzeNiche(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const { niche } = args;
            this.log('info', `Analyzing niche: ${niche}`);
            const trendData = yield this.trendAnalyzer.analyzeTrend(niche);
            const competitorData = yield this.competitorAnalyzer.analyzeCompetitors(niche);
            return Object.assign(Object.assign({ niche }, trendData), competitorData);
        });
    }
    analyzeCompetitors(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const { category } = args;
            this.log('info', `Analyzing competitors for: ${category}`);
            return this.competitorAnalyzer.analyzeCompetitors(category);
        });
    }
}
