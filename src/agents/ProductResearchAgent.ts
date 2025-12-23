import { BaseAgent } from './BaseAgent.js';
import { PersistencePort } from '../core/domain/ports/PersistencePort.js';
import { EventBusPort } from '../core/domain/ports/EventBusPort.js';
import { TrendAnalysisPort } from '../core/domain/ports/TrendAnalysisPort.js';
import { CompetitorAnalysisPort } from '../core/domain/ports/CompetitorAnalysisPort.js';
import { openAIService } from '../infra/ai/OpenAI/OpenAIService.js';
import { logger } from '../infra/logging/LoggerService.js';
import { ActivityLogEntry } from '../core/domain/types/ActivityLogEntry.js';
import { OpportunityBrief, ProductConcept, Seasonality, OpportunityDefinition, CustomerProblem, ProblemFrequency, ProblemUrgency, DemandEvidence, SignalType, TrendDirection, ConfidenceLevel, CompetitionAnalysis, CompetitionDensity, CompetitionQuality, SaturationRisk, PricingAndEconomics, MarginFeasibility, PriceSensitivity, OfferConcept, Complexity, DifferentiationStrategy, RiskAssessment, RiskLevel, TimeAndCycle, TrendPhase, ExecutionSpeedFit, ValidationPlan, TestType, KillCriteria, AssumptionsAndCertainty, EvidenceReferences } from '../core/domain/types/OpportunityBrief.js';
import { StrategyProfile, CurrentStrategy } from '../core/domain/types/StrategyProfile.js';

// --- Section 0 & 1 Interfaces ---

interface ResearchBrief {
    request_id: string;
    seasonal_window: {
        start: string;
        peak: string;
        decay: string;
    };
    target_personas: string[];
    category_constraints: string[];
    emerging_definition: {
        min_growth: number;
        time_window: string;
    };
    execution_speed: 'fast' | 'normal' | 'thorough';
    alignment_score: number;
    raw_criteria: any;
}

// --- Section 2 Interfaces ---
interface PriorLearning {
    source: 'past_product' | 'past_campaign' | 'market_report';
    insight: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    relevance_score: number;
    artifact_id?: string;
}

// --- Section 3 Interfaces ---
interface Signal {
    id: string;
    family: 'social' | 'search' | 'marketplace' | 'competitor' | 'supplier';
    source: string;
    timestamp: string;
    data: any; // Raw data (e.g., trend points, product list)
}

interface RiskAdjustment {
    factor: string;
    type: 'penalty' | 'boost';
    value: number;
    description?: string;
    reason?: string;
}

// --- Section 4 Interfaces ---
interface Theme {
    id: string;
    name: string; // Problem/Solution level (e.g. "Eco-friendly Kitchen Storage")
    description: string;
    supporting_signals: string[]; // IDs of signals
    certainty: 'Observed' | 'Inferred' | 'Assumed';
    score?: number; // For later sections
    validation?: ValidationData; // Section 8
    rationale?: string;
    confidence?: number;
    seasonality?: 'Winter' | 'Summer' | 'Evergreen' | 'Q4_Gift';
}

// --- Section 8 Interfaces ---
interface ValidationData {
    qualitative_samples: string[];
    problem_language: string[];
    competition_quality: 'low' | 'medium' | 'high';
    price_band: { min: number, max: number };
    operational_risks: string[];
}

import { AdsPlatformPort } from '../core/domain/ports/AdsPlatformPort.js';
import { ShopCompliancePort } from '../core/domain/ports/ShopCompliancePort.js';
import { VideoAnalysisPort } from '../core/domain/ports/VideoAnalysisPort.js';

import { analyzeTrendShape } from '../utils/math.js';

export class ProductResearchAgent extends BaseAgent {
  private trendAnalyzer: TrendAnalysisPort;
  private competitorAnalyzer: CompetitorAnalysisPort;
  private adsAnalyzer?: AdsPlatformPort;
  private shopCompliance?: ShopCompliancePort;
  private videoAnalyzer?: VideoAnalysisPort;
  
  // Section 0: Dependencies
  private strategyProfile: StrategyProfile | null = null;
  
  // Section 2: Context
  private activeLearnings: PriorLearning[] = [];
  private riskAdjustments: RiskAdjustment[] = [];

  // Section 3: Signals
  private collectedSignals: Signal[] = [];

  // Section 4: Themes
  private generatedThemes: Theme[] = [];

  // Section 5: Gating
  private gatedThemes: Theme[] = [];
  private rejectedThemes: { themeId: string; reason: string }[] = [];

  // Section 6: Scoring
  private rankedThemes: Theme[] = [];

  // Section 7: Time Fitness
  private timeFilteredThemes: Theme[] = [];

  // Section 8: Deep Validation
  private validatedThemes: Theme[] = [];

  // Section 9: Productization
  private concepts: ProductConcept[] = [];

  // Section 10: Opportunity Briefs
  private briefs: OpportunityBrief[] = [];

  constructor(
      db: PersistencePort, 
      eventBus: EventBusPort, 
      trendAnalyzer: TrendAnalysisPort, 
      competitorAnalyzer: CompetitorAnalysisPort,
      adsAnalyzer?: AdsPlatformPort,
      shopCompliance?: ShopCompliancePort,
      videoAnalyzer?: VideoAnalysisPort
  ) {
    super('ProductResearcher', db, eventBus);
    this.trendAnalyzer = trendAnalyzer;
    this.competitorAnalyzer = competitorAnalyzer;
    this.adsAnalyzer = adsAnalyzer;
    this.shopCompliance = shopCompliance;
    this.videoAnalyzer = videoAnalyzer;
    
    this.registerTool('find_winning_products', this.findWinningProducts.bind(this));
    this.registerTool('analyze_niche', this.analyzeNiche.bind(this));
    this.registerTool('analyze_competitors', this.analyzeCompetitors.bind(this));

    // Subscribe to Research Requests
    this.eventBus.subscribe('OpportunityResearch.Requested', 'ProductResearchAgent', async (event) => {
      this.log('info', `Received Research Request: ${event.payload.request_id}`);
      await this.handleResearchRequest(event.payload);
    });
  }

  private async logStep(action: string, category: string, status: 'started' | 'completed' | 'failed' | 'warning', message: string, details?: any, entityId?: string) {
    // Log to file system for visibility
    const logMsg = `[${category}] ${action}: ${message}`;
    if (status === 'failed') logger.error(logMsg, details);
    else if (status === 'warning') logger.warn(logMsg, details);
    else logger.info(logMsg, details);

    // Extract entityId if possible (e.g. request_id or brief_id)
    const finalEntityId = entityId || details?.request_id || details?.brief_id || details?.id;
    
    // Log to database for Control Panel
    await this.db.saveActivity({
      agent: this.name,
      action,
      category,
      status,
      message,
      details,
      entityId: typeof finalEntityId === 'string' ? finalEntityId : undefined,
      timestamp: new Date()
    });
  }

  /**
   * Section 0: Preconditions
   */
  private async loadDependencies(): Promise<boolean> {
      // In a real implementation, these would be loaded from a config service or DB
      this.strategyProfile = CurrentStrategy;
      return true;
  }

  /**
   * Section 1: Request Intake & Normalization
   */
  private async createResearchBrief(requestId: string, criteria: any): Promise<ResearchBrief> {
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
          const response = await client.chat.completions.create({
              model: openAIService.deploymentName,
              messages: [{ role: "system", content: systemPrompt }],
              temperature: 0.2,
              response_format: { type: "json_object" }
          });

          const content = response.choices[0]?.message?.content;
          if (!content) throw new Error("Empty response from AI");

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
      } catch (error) {
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
  }

  private validateAlignment(category: string): number {
      if (!this.strategyProfile) return 0;
      if (!category) return 1.0;
      if (this.strategyProfile.allowed_categories.includes('General')) return 1.0;
      return this.strategyProfile.allowed_categories.some(c => category.includes(c)) ? 1.0 : 0.1;
  }

  /**
   * Section 2: Prior Learning Ingestion
   */
  private async ingestPriorLearnings(brief: ResearchBrief): Promise<{ learnings: PriorLearning[], adjustments: RiskAdjustment[] }> {
      this.log('info', `[Section 2] Ingesting Prior Learnings for ${brief.raw_criteria.category}...`);
      
      const learnings: PriorLearning[] = [];
      const adjustments: RiskAdjustment[] = [];

      // 1. Query Past Products (Simple keyword match for now)
      // In a real system, this would be a vector search or more complex query
      try {
          const pastProducts = await this.db.getProducts('live'); // Check live history
          const relevantProducts = pastProducts.filter(p => 
              (p.tags && p.tags.includes(brief.raw_criteria.category)) || 
              p.name.toLowerCase().includes(brief.raw_criteria.category.toLowerCase())
          );

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

      } catch (e: any) {
          this.log('warn', `Failed to query past products: ${e}`);
          await this.logStep('Prior Learning Failed', 'Research', 'warning', `Failed to query past products: ${e.message}`, { error: e.stack });
      }

      // Store in context
      this.activeLearnings = learnings;
      this.riskAdjustments = adjustments;

      return { learnings, adjustments };
  }

  /**
   * Section 3: Multi-Signal Discovery
   */
  private async collectSignals(brief: ResearchBrief): Promise<Signal[]> {
      this.log('info', `[Section 3] Collecting Signals for ${brief.raw_criteria.category}...`);
      const signals: Signal[] = [];

      // 1. Search Intent (Google Trends / BigQuery)
      try {
          this.log('debug', '[collectSignals] Calling trendAnalyzer.findProducts');
          const keywords = await this.generateSearchStrategies(brief.raw_criteria.category);
          for (const keyword of keywords) {
              let products;
              try {
                  products = await this.trendAnalyzer.findProducts(keyword);
                  this.log('debug', { message: `[collectSignals] trendAnalyzer.findProducts result for "${keyword}":`, data: products });
                  logger.external('GoogleTrends', 'findProducts', { endpoint: 'GoogleTrendsAPI', keyword, productsCount: products?.length || 0, products });
              } catch (err: any) {
                  logger.external('GoogleTrends', 'findProducts', { endpoint: 'GoogleTrendsAPI', keyword, error: err?.message });
              }
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
      } catch (e: any) {
          this.log('error', `[collectSignals] Failed to collect Search signals: ${e}`);
          logger.external('GoogleTrends', 'findProducts', { endpoint: 'GoogleTrendsAPI', error: e?.message });
          await this.logStep('Signal Collection Failed', 'Discovery', 'failed', `Failed to collect Search signals: ${e.message}`, { error: e.stack });
      }

      // 2. Competitor Analysis (Marketplace Movement)
      try {
          this.log('debug', '[collectSignals] Calling competitorAnalyzer.analyzeCompetitors');
          const seedProducts = signals
              .filter(s => s.family === 'search')
              .flatMap(s => s.data.products)
              .slice(0, 3);
          for (const prod of seedProducts) {
              let compData;
              try {
                  compData = await this.competitorAnalyzer.analyzeCompetitors(prod.name);
                  this.log('debug', { message: `[collectSignals] competitorAnalyzer.analyzeCompetitors result for "${prod.name}":`, data: compData });
                  logger.external('CompetitorAnalysis', 'analyzeCompetitors', { endpoint: 'Facebook/Meta', product: prod.name, result: compData });
              } catch (err: any) {
                  logger.external('CompetitorAnalysis', 'analyzeCompetitors', { endpoint: 'Facebook/Meta', product: prod.name, error: err?.message });
              }
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
      } catch (e: any) {
          this.log('error', `[collectSignals] Failed to collect Competitor signals: ${e}`);
          logger.external('CompetitorAnalysis', 'analyzeCompetitors', { endpoint: 'Facebook/Meta', error: e?.message });
          await this.logStep('Signal Collection Failed', 'Discovery', 'failed', `Failed to collect Competitor signals: ${e.message}`, { error: e.stack });
      }

      // 3. Video Analysis (YouTube)
      if (this.videoAnalyzer) {
          try {
              this.log('debug', '[collectSignals] Calling videoAnalyzer.searchVideos');
              const seedProducts = signals
                  .filter(s => s.family === 'search')
                  .flatMap(s => s.data.products)
                  .slice(0, 3);
              
              for (const prod of seedProducts) {
                  let videoData;
                  try {
                      videoData = await this.videoAnalyzer.searchVideos(prod.name, 5);
                      this.log('debug', { message: `[collectSignals] videoAnalyzer.searchVideos result for "${prod.name}":`, data: videoData });
                      logger.external('YouTube', 'searchVideos', { endpoint: 'YouTubeAPI', product: prod.name, resultCount: videoData.length });
                  } catch (err: any) {
                      logger.external('YouTube', 'searchVideos', { endpoint: 'YouTubeAPI', product: prod.name, error: err?.message });
                  }

                  if (videoData && videoData.length > 0) {
                      signals.push({
                          id: `sig_video_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                          family: 'social',
                          source: 'YouTube',
                          timestamp: new Date().toISOString(),
                          data: { product: prod.name, videos: videoData }
                      });
                  }
              }
          } catch (e: any) {
              this.log('error', `[collectSignals] Failed to collect Video signals: ${e}`);
              logger.external('YouTube', 'searchVideos', { endpoint: 'YouTubeAPI', error: e?.message });
              await this.logStep('Signal Collection Failed', 'Discovery', 'failed', `Failed to collect Video signals: ${e.message}`, { error: e.stack });
          }
      } else {
          this.log('warn', '[collectSignals] Video Analyzer not available. Skipping YouTube analysis.');
      }


      // 3. Ads Validation (Search Volume / CPC)
      try {
          this.log('debug', '[collectSignals] Calling adsAnalyzer.getKeywordMetrics');
          if (this.adsAnalyzer && this.adsAnalyzer.getKeywordMetrics) {
              const keywords = signals
                  .filter(s => s.family === 'search')
                  .map(s => s.data.keyword);
              if (keywords.length > 0) {
                  let metrics;
                  try {
                      metrics = await this.adsAnalyzer.getKeywordMetrics(keywords);
                      this.log('debug', { message: `[collectSignals] adsAnalyzer.getKeywordMetrics result:`, data: metrics });
                      logger.external('GoogleAds', 'getKeywordMetrics', { endpoint: 'GoogleAdsAPI', keywords, metrics });
                  } catch (err: any) {
                      logger.external('GoogleAds', 'getKeywordMetrics', { endpoint: 'GoogleAdsAPI', keywords, error: err?.message });
                  }
                  if (metrics) {
                      signals.push({
                          id: `sig_ads_${Date.now()}`,
                          family: 'marketplace',
                          source: 'GoogleAds',
                          timestamp: new Date().toISOString(),
                          data: { metrics }
                      });
                  }
              }
          }
      } catch (e: any) {
          this.log('warn', `[collectSignals] Failed to collect Ads signals: ${e}`);
          logger.external('GoogleAds', 'getKeywordMetrics', { endpoint: 'GoogleAdsAPI', error: e?.message });
      }

      // 4. Shop Compliance (Shopify)
      try {
          this.log('debug', '[collectSignals] Calling shopCompliance.checkPolicy');
          if (this.shopCompliance && this.shopCompliance.checkPolicy) {
              let shopResult;
              try {
                  shopResult = await this.shopCompliance.checkPolicy(brief.raw_criteria.category, '');
                  this.log('debug', { message: `[collectSignals] shopCompliance.checkPolicy result:`, data: shopResult });
                  logger.external('Shopify', 'checkPolicy', { endpoint: 'ShopifyAPI', category: brief.raw_criteria.category, result: shopResult });
              } catch (err: any) {
                  logger.external('Shopify', 'checkPolicy', { endpoint: 'ShopifyAPI', category: brief.raw_criteria.category, error: err?.message });
              }
              if (shopResult) {
                  signals.push({
                      id: `sig_shop_${Date.now()}`,
                      family: 'marketplace',
                      source: 'Shopify',
                      timestamp: new Date().toISOString(),
                      data: { shopResult }
                  });
              }
          }
      } catch (e: any) {
          this.log('warn', `[collectSignals] Failed to collect Shop Compliance signals: ${e}`);
          logger.external('Shopify', 'checkPolicy', { endpoint: 'ShopifyAPI', error: e?.message });
      }

      // 5. Video Analysis (YouTube)
      try {
          this.log('debug', '[collectSignals] Calling videoAnalyzer.searchVideos');
          if (this.videoAnalyzer && this.videoAnalyzer.searchVideos) {
              let videoResults;
              try {
                  videoResults = await this.videoAnalyzer.searchVideos(brief.raw_criteria.category, 5);
                  this.log('debug', { message: `[collectSignals] videoAnalyzer.searchVideos result:`, data: videoResults });
                  logger.external('YouTube', 'searchVideos', { endpoint: 'YouTubeAPI', category: brief.raw_criteria.category, resultCount: videoResults?.length || 0, result: videoResults });
              } catch (err: any) {
                  logger.external('YouTube', 'searchVideos', { endpoint: 'YouTubeAPI', category: brief.raw_criteria.category, error: err?.message });
              }
              if (videoResults) {
                  signals.push({
                      id: `sig_video_${Date.now()}`,
                      family: 'social',
                      source: 'YouTube',
                      timestamp: new Date().toISOString(),
                      data: { videoResults }
                  });
              }
          }
      } catch (e: any) {
          this.log('warn', `[collectSignals] Failed to collect Video signals: ${e}`);
          logger.external('YouTube', 'searchVideos', { endpoint: 'YouTubeAPI', error: e?.message });
      }

      // Check constraint: At least two families
      const families = new Set(signals.map(s => s.family));
      if (families.size < 2) {
          this.log('warn', `[Section 3] Only collected ${families.size} signal families. Requirement is 2.`);
          // Strict Mode: Do not mock missing signals.
      }

      this.collectedSignals = signals;
      return signals;
  }

  /**
   * Section 4: Theme Generation
   */
  private async generateThemes(signals: Signal[]): Promise<Theme[]> {
      this.log('info', `[Section 4] Generating Themes from ${signals.length} signals...`);
      
      try {
          // Use OpenAI to cluster signals into semantic themes
          const rawThemes = await openAIService.generateThemes(signals);
          
          const validSignalIds = new Set(signals.map(s => s.id));

          const themes: Theme[] = rawThemes.map((t: any) => ({
              id: `theme_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              name: t.name,
              description: t.description,
              supporting_signals: (t.signal_ids || []).filter((id: string) => validSignalIds.has(id)),
              certainty: (t.confidence && t.confidence > 0.8) ? 'Observed' : 'Inferred',
              rationale: t.rationale,
              confidence: t.confidence,
              seasonality: t.seasonality
          }));

          this.generatedThemes = themes;
          return themes;
      } catch (error) {
          this.log('error', `Failed to generate themes via AI: ${error}`);
          return [];
      }
  }

  /**
   * Section 5: Hard-Gate Filtering
   */
  private async gateThemes(themes: Theme[], brief: ResearchBrief): Promise<{ passed: Theme[], rejected: { themeId: string, reason: string }[] }> {
      this.log('info', `[Section 5] Gating ${themes.length} themes...`);
      
      const passed: Theme[] = [];
      const rejected: { themeId: string, reason: string }[] = [];

      // Define Blacklist (Mock)
      const blacklist = ['weapons', 'drugs', 'adult', 'counterfeit', 'hazardous'];
      const fulfillmentRisks = ['glass', 'liquid', 'heavy', 'furniture', 'battery'];

      for (const theme of themes) {
          const nameLower = theme.name.toLowerCase();
          let rejectReason: string | null = null;

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
                      if (c.startsWith('no ')) return nameLower.includes(c.replace('no ', ''));
                      return false;
                  });
                  if (violatesConstraint) rejectReason = 'Violates Brief Constraints';
              }
          }

          // 4. No Clear Problem Signal (Mock: If description is too short or generic)
          if (!rejectReason && theme.description.length < 10) {
              rejectReason = 'No clear problem signal';
          }

          if (rejectReason) {
              rejected.push({ themeId: theme.id, reason: rejectReason });
          } else {
              passed.push(theme);
          }
      }

      this.gatedThemes = passed;
      this.rejectedThemes = rejected;
      return { passed, rejected };
  }

  /**
   * Section 6: Preliminary Scoring & Ranking
   */
  private async scoreAndRankThemes(themes: Theme[], adjustments: RiskAdjustment[]): Promise<Theme[]> {
      this.log('info', `[Section 6] Scoring ${themes.length} themes...`);
      
      // Default weights
      const weights = this.strategyProfile?.scoring_config?.weights || {
          demand: 0.4,
          trend: 0.3,
          competition: 0.2,
          risk: 0.1
      };

      const scoredThemes = themes.map(theme => {
          const signals = this.collectedSignals.filter(s => theme.supporting_signals.includes(s.id));
          
          // 1. Demand Strength (0-100)
          // Aggregate search volume and social views
          let totalVolume = 0;
          let totalViews = 0;
          
          for (const s of signals) {
              if (s.family === 'search' && s.data.volume) totalVolume += s.data.volume;
              if (s.family === 'social' && s.data.views) totalViews += s.data.views;
          }
          
          // Normalize (Assumptions: High Volume = 100k, High Views = 1M)
          const normVolume = Math.min(totalVolume / 100000, 1) * 100;
          const normViews = Math.min(totalViews / 1000000, 1) * 100;
          const demandScore = Math.max(normVolume, normViews); // Take the strongest signal

          // 2. Trend Velocity (0-100)
          // Calculate slope of trend points
          let maxSlope = 0;
          for (const s of signals) {
              if (s.family === 'search' && s.data.trend_points && Array.isArray(s.data.trend_points)) {
                  const points = s.data.trend_points;
                  if (points.length > 1) {
                      const slope = (points[points.length - 1] - points[0]) / points.length;
                      maxSlope = Math.max(maxSlope, slope);
                  }
              }
          }
          // Normalize slope (Assumption: Slope of 5 is high growth)
          const trendScore = Math.min(Math.max(maxSlope, 0) / 5, 1) * 100;

          // 3. Competition Density (0-100)
          // Count competitor signals
          const competitorCount = signals.filter(s => s.family === 'competitor').length;
          // Normalize (Assumption: 10 competitors is saturated)
          const competitionScore = Math.min(competitorCount / 10, 1) * 100;

          // 4. Risk Adjustment
          let riskScore = 50; // Start neutral
          for (const adj of adjustments) {
              if (adj.type === 'penalty') riskScore += adj.value; 
              if (adj.type === 'boost') riskScore += adj.value;
          }
          riskScore = Math.max(0, Math.min(100, riskScore));

          // Calculate Final Score
          // Score = (Demand * 0.4) + (Trend * 0.3) + (LowCompetition * 0.2) + (Risk * 0.1)
          // We invert competition score because Low Competition is good.
          const competitionFactor = 100 - competitionScore;

          let finalScore = (demandScore * weights.demand) + 
                           (trendScore * weights.trend) + 
                           (competitionFactor * weights.competition) + 
                           (riskScore * weights.risk);
          
          // Cap at 100
          finalScore = Math.min(100, Math.max(0, finalScore));

          return { ...theme, score: parseFloat(finalScore.toFixed(2)) };
      });

      // Rank
      scoredThemes.sort((a, b) => (b.score || 0) - (a.score || 0));

      // Top 10 only
      const topThemes = scoredThemes.slice(0, 10);
      
      this.rankedThemes = topThemes;
      return topThemes;
  }

  /**
   * Section 7: Time & Cycle Fitness Check
   */
  private async checkTimeFitness(themes: Theme[], brief: ResearchBrief): Promise<{ passed: Theme[], notes: any[] }> {
      this.log('info', `[Section 7] Checking Time Fitness for ${themes.length} themes...`);
      
      const passed: Theme[] = [];
      const notes: any[] = [];
      const currentMonth = new Date().getMonth() + 1; // 1-12

      // Execution Speed Mapping (Days to launch)
      const executionDays = {
          'fast': 7,
          'normal': 14,
          'thorough': 30
      }[brief.execution_speed] || 14;

      for (const theme of themes) {
          const signals = this.collectedSignals.filter(s => theme.supporting_signals.includes(s.id));
          
          // 1. Analyze Trend Shape
          let trendShape = 'Flat';
          let trendPoints: number[] = [];
          
          // Find the best trend signal
          for (const s of signals) {
              if (s.family === 'search' && s.data.trend_points && Array.isArray(s.data.trend_points)) {
                  if (s.data.trend_points.length > trendPoints.length) {
                      trendPoints = s.data.trend_points;
                  }
              }
          }

          if (trendPoints.length >= 5) {
              trendShape = analyzeTrendShape(trendPoints);
          }

          // 2. Estimate Opportunity Window
          let windowDays = 0;
          if (trendShape === 'Rising') windowDays = 90;
          if (trendShape === 'Peaking') windowDays = 30;
          if (trendShape === 'Falling') windowDays = 0;
          if (trendShape === 'Flat') windowDays = 45; // Stable demand

          // 3. Seasonality Check
          let seasonalityPenalty = false;
          if (theme.seasonality === 'Winter' && currentMonth > 11) seasonalityPenalty = true; // Too late for Winter (Dec)
          if (theme.seasonality === 'Summer' && currentMonth > 6) seasonalityPenalty = true; // Too late for Summer (July)
          if (theme.seasonality === 'Q4_Gift' && currentMonth > 11) seasonalityPenalty = true; // Too late for Xmas

          if (seasonalityPenalty) {
              windowDays = 0;
              this.log('info', `Theme ${theme.name} rejected due to Seasonality (${theme.seasonality}) vs Month ${currentMonth}`);
          }

          // 4. Compare
          const isViable = windowDays >= executionDays;

          notes.push({
              themeId: theme.id,
              trendShape,
              seasonality: theme.seasonality,
              windowDays,
              executionDays,
              isViable
          });

          if (isViable) {
              passed.push(theme);
          } else {
              this.log('info', `Theme ${theme.name} rejected: Window (${windowDays}d) < Execution (${executionDays}d) [Shape: ${trendShape}]`);
          }
      }

      this.timeFilteredThemes = passed;
      return { passed, notes };
  }

  /**
   * Section 8: Deep Validation
   */
  private async performDeepValidation(themes: Theme[]): Promise<Theme[]> {
      this.log('info', `[Section 8] Performing Deep Validation on top ${themes.length} themes...`);
      
      const validated: Theme[] = [];
      // Limit to top 5 for deep scan as per checklist
      const candidates = themes.slice(0, 5);

      for (const theme of candidates) {
          // Real Deep Scan using LLM
          this.log('info', `[Section 8] Validating theme: ${theme.name}`);
          
          let validation: ValidationData;
          try {
              const result = await openAIService.validateTheme(theme);
              if (result) {
                  validation = result;
              } else {
                  throw new Error("Failed to generate validation data");
              }
          } catch (e) {
              this.log('error', `[Section 8] Validation failed for ${theme.name}, falling back to heuristic.`);
              validation = {
                  qualitative_samples: ["Data unavailable"],
                  problem_language: ["unknown"],
                  competition_quality: 'medium',
                  price_band: { min: 0, max: 0 },
                  operational_risks: ["Validation Error"]
              };
          }

          // Enrich theme
          theme.validation = validation;
          validated.push(theme);
      }

      this.validatedThemes = validated;
      return validated;
  }

  /**
   * Section 9: Productization
   */
  private async createOfferConcepts(themes: Theme[]): Promise<ProductConcept[]> {
      this.log('info', `[Section 9] Creating Offer Concepts for ${themes.length} themes...`);
      
      const concepts: ProductConcept[] = [];

      for (const theme of themes) {
          // Real Concept Generation using LLM
          this.log('info', `[Section 9] Generating concept for: ${theme.name}`);
          
          let concept: ProductConcept;
          try {
              const result = await openAIService.generateConcept(theme, theme.validation);
              if (result) {
                  concept = {
                      ...result,
                      theme_id: theme.id
                  };
              } else {
                  throw new Error("Failed to generate concept");
              }
          } catch (e) {
              this.log('error', `[Section 9] Concept generation failed for ${theme.name}, falling back to heuristic.`);
              concept = {
                  theme_id: theme.id,
                  core_hypothesis: `If we sell ${theme.name}, we can capture the market.`,
                  bundle_options: ["Standard"],
                  target_persona: "General Audience",
                  usage_scenario: "Daily use",
                  differentiation: "Standard",
                  supplier_check: 'pass'
              };
          }

          concepts.push(concept);
      }

      this.concepts = concepts;
      return concepts;
  }

  /**
   * Section 10: Opportunity Brief Creation
   */
  private async createOpportunityBriefs(concepts: ProductConcept[], themes: Theme[], requestId: string, researchBrief: ResearchBrief): Promise<OpportunityBrief[]> {
      this.log('info', `[Section 10] Creating Opportunity Briefs for top concepts...`);
      
      const briefs: OpportunityBrief[] = [];
      // Limit to top 3 as per checklist
      const topConcepts = concepts.slice(0, 3);

      for (const concept of topConcepts) {
          const theme = themes.find(t => t.id === concept.theme_id);
          if (!theme) continue;

          const briefId = `opp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

          // Determine Seasonality
          let seasonality: Seasonality = 'hybrid';
          // Simple heuristic: if peak is defined, it's likely seasonal or hybrid. 
          // If start/peak/decay are generic or span full year, maybe evergreen.
          // For now, default to hybrid.

          const opportunityDefinition: OpportunityDefinition = {
              theme_name: theme.name,
              category: researchBrief.category_constraints[0] || 'General',
              seasonality: seasonality,
              target_geo: ['US'], // Default for now
              target_personas: [concept.target_persona],
              use_scenario: concept.usage_scenario
          };

          const customerProblem: CustomerProblem = {
              problem_statement: concept.core_hypothesis,
              problem_frequency: (seasonality as string) === 'seasonal' ? 'seasonal' : 'recurring',
              current_solutions: ["Generic alternatives", "DIY solutions"], // Placeholder
              problem_urgency: 'medium'
          };

          const demandEvidence: DemandEvidence = {
              signal_types_used: ['social', 'search'], // Mock - should derive from theme.supporting_signals
              why_now_summary: `Trend velocity is high with ${theme.supporting_signals.length} signals detected.`,
              demand_trend_direction: 'rising',
              demand_velocity_confidence: 'medium'
          };

          // Map internal validation quality to schema CompetitionQuality
          const mapCompQuality = (q?: string): CompetitionQuality => {
              if (q === 'low') return 'weak';
              if (q === 'high') return 'strong';
              return 'mixed';
          };

          const competitionAnalysis: CompetitionAnalysis = {
              competition_density: 'medium', // Placeholder
              competition_quality: mapCompQuality(theme.validation?.competition_quality),
              dominant_positioning_patterns: ["Price leader", "Feature stuffer"], // Placeholder
              obvious_gaps: [concept.differentiation],
              saturation_risk: 'medium' // Placeholder
          };

          const pricingAndEconomics: PricingAndEconomics = {
              expected_price_band: theme.validation?.price_band || { min: 20, max: 50 },
              margin_feasibility: 'viable', // Placeholder - would need supplier data
              price_sensitivity: 'medium' // Placeholder
          };

          const offerConcept: OfferConcept = {
              core_product_hypothesis: concept.core_hypothesis,
              key_attributes: [concept.differentiation], // Placeholder
              bundle_or_upsell_ideas: concept.bundle_options,
              expected_complexity: 'medium' // Placeholder
          };

          const differentiationStrategy: DifferentiationStrategy = {
              primary_differentiator: concept.differentiation,
              secondary_differentiators: ["Better packaging", "Faster shipping"], // Placeholder
              angle_whitespace_summary: "Competitors focus on price; we focus on quality/speed." // Placeholder
          };

          const riskAssessment: RiskAssessment = {
              fulfillment_risk: 'low', // Placeholder
              customer_support_risk: 'medium', // Placeholder
              platform_policy_risk: 'low', // Placeholder
              supplier_risk_proxy: concept.supplier_check === 'pass' ? 'low' : 'high',
              known_failure_modes: ["Supplier stockout", "Shipping delays"] // Placeholder
          };

          const timeAndCycle: TimeAndCycle = {
              trend_phase: 'mid', // Placeholder - should come from trend analysis
              estimated_window_weeks: 12, // Placeholder
              execution_speed_fit: 'good' // Placeholder
          };

          const validationPlan: ValidationPlan = {
              test_type: 'ads', // Default
              test_goal: "Validate CTR > 1.5%",
              max_test_budget: 200, // Default
              success_signals: ["CTR > 1.5%", "CPC < $1.00"],
              data_required_days: 3
          };

          const killCriteria: KillCriteria = {
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

          const assumptionsAndCertainty: AssumptionsAndCertainty = {
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

          const evidenceReferences: EvidenceReferences = {
              evidence_ids: theme.supporting_signals,
              signal_source_map: theme.supporting_signals.reduce((acc, sigId) => {
                  const signal = this.collectedSignals.find(s => s.id === sigId);
                  if (signal) {
                      acc[sigId] = signal.source;
                  }
                  return acc;
              }, {} as Record<string, string>)
          };

          const brief: OpportunityBrief = {
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
                  competitor_saturation: theme.validation?.competition_quality || 'medium'
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
  }

  /**
   * Event Handler for OpportunityResearch.Requested
   */
  private async handleResearchRequest(payload: { request_id: string, criteria: any }) {
    const { request_id, criteria } = payload;
    this.log('info', `[Section 1] Processing Request: ${request_id}`);
    await this.logStep('Pipeline Start', 'System', 'started', `Starting Research Pipeline for Request: ${request_id}`, payload, request_id);

    try {
        // Section 0: Preconditions
        await this.logStep('Step 0: Dependencies', 'Initialization', 'started', 'Loading dependencies...', undefined, request_id);
        if (!await this.loadDependencies()) {
            throw new Error("Failed to load dependencies (Strategy Profile, etc.)");
        }
        await this.logStep('Step 0: Dependencies', 'Initialization', 'completed', 'Dependencies loaded.', undefined, request_id);

        // Section 1: Request Intake & Normalization
        await this.logStep('Step 1: Brief', 'Research', 'started', 'Creating research brief...', undefined, request_id);
        const brief = await this.createResearchBrief(request_id, criteria);
        
        if (brief.alignment_score < 0.5) {
             throw new Error(`Request aligned poorly with strategy (Score: ${brief.alignment_score})`);
        }

        const briefId = `brief_${request_id}_${Date.now()}`;
        
        // Emit BriefCreated
        await this.eventBus.publish('OpportunityResearch.BriefCreated', {
            brief_id: briefId,
            initial_scope: brief // Send the full structured brief
        }, request_id);

        this.log('info', `[Section 1] Brief Created: ${briefId}`);
        await this.logStep('Step 1: Brief', 'Research', 'completed', `Research brief created for '${brief.raw_criteria.category}' targeting '${brief.target_personas.join(', ')}'.`, brief, request_id);

        // Section 2: Prior Learning Ingestion
        await this.logStep('Step 2: Learnings', 'Research', 'started', 'Ingesting prior learnings...', undefined, request_id);
        const { learnings, adjustments } = await this.ingestPriorLearnings(brief);
        
        await this.eventBus.publish('OpportunityResearch.PriorLearningsAttached' as any, {
            brief_id: briefId,
            learnings_count: learnings.length,
            adjustments_applied: adjustments,
            artifacts: learnings.map(l => l.artifact_id).filter(Boolean)
        }, request_id);

        this.log('info', `[Section 2] Prior Learnings Attached: ${learnings.length} items`);
        await this.logStep('Step 2: Learnings', 'Research', 'completed', `Ingested ${learnings.length} prior learnings relevant to this category.`, { learnings, adjustments }, request_id);

        // Section 3: Multi-Signal Discovery
        await this.logStep('Step 3: Signals', 'Discovery', 'started', 'Collecting signals...', undefined, request_id);
        const signals = await this.collectSignals(brief);
        
        if (signals.length === 0) {
            const msg = 'No signals collected. Aborting research pipeline.';
            this.log('error', msg);
            await this.logStep('Step 3: Signals', 'Discovery', 'failed', msg, { count: 0 }, request_id);
            throw new Error(msg);
        }

        await this.eventBus.publish('OpportunityResearch.SignalsCollected', {
            brief_id: briefId,
            signal_count: signals.length,
            sources: [...new Set(signals.map(s => s.source))]
        }, request_id);

        this.log('info', `[Section 3] Signals Collected: ${signals.length} items from ${[...new Set(signals.map(s => s.family))].join(', ')}`);
        await this.logStep('Step 3: Signals', 'Discovery', 'completed', `Collected ${signals.length} signals from ${[...new Set(signals.map(s => s.family))].join(', ')}.`, { signals }, request_id);

        // Section 4: Theme Generation
        await this.logStep('Step 4: Themes', 'Analysis', 'started', 'Generating themes...', undefined, request_id);
        const themes = await this.generateThemes(signals);

        await this.eventBus.publish('OpportunityResearch.ThemesGenerated' as any, {
            brief_id: briefId,
            themes: themes
        }, request_id);

        this.log('info', `[Section 4] Themes Generated: ${themes.length} themes`);
        await this.logStep('Step 4: Themes', 'Analysis', 'completed', `Generated ${themes.length} themes: ${themes.map(t => t.name).join(', ')}.`, { themes }, request_id);

        // Section 5: Hard-Gate Filtering
        await this.logStep('Step 5: Gating', 'Filtering', 'started', 'Gating themes...', undefined, request_id);
        const { passed, rejected } = await this.gateThemes(themes, brief);

        await this.eventBus.publish('OpportunityResearch.ThemesGated' as any, {
            brief_id: briefId,
            pass_count: passed.length,
            reject_count: rejected.length,
            rejection_summary: rejected.map(r => r.reason)
        }, request_id);

        this.log('info', `[Section 5] Themes Gated: ${passed.length} passed, ${rejected.length} rejected`);
        await this.logStep('Step 5: Gating', 'Filtering', 'completed', `Gated down to ${passed.length} themes. Passed: ${passed.map(t => t.name).join(', ')}.`, { passed, rejected }, request_id);

        // Section 6: Preliminary Scoring & Ranking
        await this.logStep('Step 6: Scoring', 'Ranking', 'started', 'Scoring and ranking themes...', undefined, request_id);
        const rankedThemes = await this.scoreAndRankThemes(passed, adjustments);

        await this.eventBus.publish('OpportunityResearch.ShortlistRanked' as any, {
            brief_id: briefId,
            candidates: rankedThemes
        }, request_id);

        this.log('info', `[Section 6] Shortlist Ranked: Top ${rankedThemes.length} themes`);
        await this.logStep('Step 6: Scoring', 'Ranking', 'completed', `Ranked ${rankedThemes.length} themes. Top candidate: ${rankedThemes[0]?.name} (Score: ${rankedThemes[0]?.score}).`, { rankedThemes }, request_id);

        // Section 7: Time & Cycle Fitness Check
        await this.logStep('Step 7: Time Fitness', 'Filtering', 'started', 'Checking time fitness...', undefined, request_id);
        const { passed: timePassed, notes: timeNotes } = await this.checkTimeFitness(rankedThemes, brief);

        await this.eventBus.publish('OpportunityResearch.TimeFiltered' as any, {
            brief_id: briefId,
            pass_count: timePassed.length,
            reject_count: rankedThemes.length - timePassed.length,
            time_notes: timeNotes
        }, request_id);

        this.log('info', `[Section 7] Time Filtered: ${timePassed.length} passed`);
        await this.logStep('Step 7: Time Fitness', 'Filtering', 'completed', `${timePassed.length} themes passed time fitness check.`, { passed: timePassed, notes: timeNotes }, request_id);

        // Section 8: Deep Validation
        await this.logStep('Step 8: Deep Validation', 'Validation', 'started', 'Performing deep validation...', undefined, request_id);
        const validatedThemes = await this.performDeepValidation(timePassed);

        await this.eventBus.publish('OpportunityResearch.ValidatedCandidatesReady' as any, {
            brief_id: briefId,
            candidate_count: validatedThemes.length,
            candidates: validatedThemes
        }, request_id);

        this.log('info', `[Section 8] Validated Candidates Ready: ${validatedThemes.length} themes`);
        await this.logStep('Step 8: Deep Validation', 'Validation', 'completed', `Validated ${validatedThemes.length} themes ready for productization.`, { validatedThemes }, request_id);

        // Section 9: Productization
        await this.logStep('Step 9: Productization', 'Concepting', 'started', 'Creating offer concepts...', undefined, request_id);
        const concepts = await this.createOfferConcepts(validatedThemes);

        await this.eventBus.publish('OpportunityResearch.OfferConceptsCreated' as any, {
            brief_id: briefId,
            concept_count: concepts.length,
            concepts: concepts
        }, request_id);

        this.log('info', `[Section 9] Offer Concepts Created: ${concepts.length} concepts`);
        await this.logStep('Step 9: Productization', 'Concepting', 'completed', `Created ${concepts.length} offer concepts: ${concepts.map(c => c.core_hypothesis).join(', ')}.`, { concepts }, request_id);

        // Section 10: Opportunity Brief Creation
        await this.logStep('Step 10: Briefs', 'Output', 'started', 'Creating opportunity briefs...', undefined, request_id);
        const briefs = await this.createOpportunityBriefs(concepts, validatedThemes, request_id, brief);

        // Save briefs to DB
        for (const b of briefs) {
            await this.db.saveBrief(b);
        }

        await this.eventBus.publish('OpportunityResearch.BriefsPublished' as any, {
            brief_id: briefId,
            brief_count: briefs.length,
            briefs: briefs
        }, request_id);

        this.log('info', `[Section 10] Briefs Published: ${briefs.length} briefs`);
        await this.logStep('Step 10: Briefs', 'Output', 'completed', `Published ${briefs.length} opportunity briefs.`, { briefs }, request_id);

        // Section 11: Handoff via Events
        this.log('info', `[Section 11] Initiating Handoff for ${briefs.length} opportunities...`);
        await this.logStep('Step 11: Handoff', 'Output', 'started', 'Initiating handoff...', undefined, request_id);

        for (const brief of briefs) {
            // 1. Request Supplier Feasibility Check
            await this.eventBus.publish('Supplier.FeasibilityRequested' as any, {
                brief_id: briefId,
                opportunity_id: brief.id,
                concept: brief.concept
            }, request_id);

            // 2. Request Marketing Angle Analysis
            await this.eventBus.publish('Marketing.AngleWhitespaceRequested' as any, {
                brief_id: briefId,
                opportunity_id: brief.id,
                concept: brief.concept
            }, request_id);
        }

        this.log('info', `[Section 11] Handoff Complete. Research Cycle Finished.`);
        await this.logStep('Step 11: Handoff', 'Output', 'completed', 'Handoff complete.', undefined, request_id);
        await this.logStep('Pipeline Complete', 'System', 'completed', `Pipeline Complete. Generated ${briefs.length} briefs.`, { briefs: briefs.map(b => b.id) }, request_id);

    } catch (error: any) {
      this.log('error', `Research Aborted: ${error.message}`);
      await this.logStep('Pipeline Failed', 'System', 'failed', `Pipeline Failed: ${error.message}`, { error: error.stack }, request_id);
      await this.eventBus.publish('OpportunityResearch.Aborted', {
        brief_id: `unknown_${request_id}`,
        reason: error.message
      }, request_id);
    }
  }

  private async generateSearchStrategies(userInput: string): Promise<string[]> {
    try {
      const client = openAIService.getClient();
      const response = await client.chat.completions.create({
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

      const content = response.choices[0]?.message?.content?.trim();
      if (content) {
        const keywords = content.split(',').map(k => k.trim()).filter(k => k.length > 0);
        this.log('info', `🤖 AI Search Strategy: "${userInput}" ➔ [${keywords.join(', ')}]`);
        return keywords;
      }
    } catch (error) {
      this.log('warn', `AI strategy generation failed: ${error}. Using original input.`);
    }
    return [userInput];
  }

  /**
   * Workflow Action: find_products
   * Triggered by: RESEARCH_REQUESTED
   */
  async find_products(payload: any) {
      const rawCategory = payload.category || 'General';
      // Use the robust findWinningProducts logic
      const result = await this.findWinningProducts({ category: rawCategory });
      
      if (result.products && result.products.length > 0) {
          for (const product of result.products) {
              this.log('info', `✅ Found product: ${product.name}`, { productId: product.id });
              await this.eventBus.publish('Product.Found', { product });
          }
      } else {
          this.log('warn', `❌ No products found for category "${rawCategory}" after AI analysis.`);
      }
  }

  private async findWinningProducts(args: { category: string, criteria?: any }) {
    const { category: rawCategory, criteria } = args;
    
    // 1. Generate strategies (Iterative approach)
    const searchTerms = await this.generateSearchStrategies(rawCategory);
    
    let allProducts: any[] = [];
    let usedKeyword = rawCategory; // Default fallback

    // 2. Iterate through terms
    for (const term of searchTerms) {
        this.log('info', `🔎 Strategy: Searching BigQuery for "${term}"...`);
        try {
            const products = await this.trendAnalyzer.findProducts(term);
            
            if (products && products.length > 0) {
                this.log('info', `   Found ${products.length} products for "${term}"`);
                allProducts = [...allProducts, ...products];
                usedKeyword = term; // Track the last successful term (or we could track the 'best' one)
            } else {
                this.log('info', `   No products found for "${term}"`);
            }
        } catch (error: any) {
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
        this.log('info', `   Stats: Profit Potential ${winner.profitPotential?.toFixed(1)} | Demand ${winner.demandScore} | Competition ${winner.competitionScore}`);
        if (uniqueProducts.length > 1) {
            this.log('info', `   (Selected over ${uniqueProducts.length - 1} other candidates like "${uniqueProducts[1].name}")`);
        }
    } else {
        this.log('warn', `❌ No viable products found after analyzing all strategies.`);
    }
    
    // If we found products, return them. If not, we return empty list and the last attempted keyword.
    return { products: uniqueProducts, usedKeyword: uniqueProducts.length > 0 ? usedKeyword : searchTerms[0] };
  }

  async analyzeNiche(args: { niche: string }) {
    const { niche } = args;
    this.log('info', `Analyzing niche: ${niche}`);
    
    const trendData = await this.trendAnalyzer.analyzeTrend(niche);
    const competitorData = await this.competitorAnalyzer.analyzeCompetitors(niche);
    
    return {
      niche,
      ...trendData,
      ...competitorData
    };
  }

  async analyzeCompetitors(args: { category: string }) {
    const { category } = args;
    this.log('info', `Analyzing competitors for: ${category}`);
    return this.competitorAnalyzer.analyzeCompetitors(category);
  }
}
