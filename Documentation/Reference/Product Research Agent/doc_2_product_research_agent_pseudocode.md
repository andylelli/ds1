# DOCUMENT 2
## Product Research (Opportunity) Agent — High-Level Pseudocode
*(EventBus-driven, MCP-based, agent-only)*

---

### PURPOSE
This pseudocode shows **how the Product Research Agent executes the checklist autonomously**, using:
- an **EventBus** for coordination
- **MCP tools** for external sensing
- **Enterprise Memory** for learning

It defines **control flow**, **decision gates**, and **event emissions** — not implementation.

---

## Agent Interface

```pseudo
AGENT ProductResearchAgent
```

### Subscriptions (EventBus)
```pseudo
SUBSCRIBE OpportunityResearch.Requested
SUBSCRIBE Experiment.ResultsRecorded
SUBSCRIBE Decision.Killed
```

### Publications (EventBus)
```pseudo
PUBLISH OpportunityResearch.Aborted
PUBLISH OpportunityResearch.BriefCreated
PUBLISH OpportunityResearch.PriorLearningsAttached
PUBLISH OpportunityResearch.SignalsCollected
PUBLISH OpportunityResearch.ThemesGenerated
PUBLISH OpportunityResearch.ThemesGated
PUBLISH OpportunityResearch.ShortlistRanked
PUBLISH OpportunityResearch.TimeFiltered
PUBLISH OpportunityResearch.ValidatedCandidatesReady
PUBLISH OpportunityResearch.OfferConceptsCreated
PUBLISH OpportunityResearch.BriefsPublished
PUBLISH OpportunityResearch.LearningCaptured

PUBLISH Supplier.FeasibilityRequested
PUBLISH Marketing.AngleWhitespaceRequested
PUBLISH Operations.RiskReviewRequested
PUBLISH Analytics.ScoreReviewRequested
```

---

## Core Execution Flow

### On Research Request

```pseudo
ON EVENT OpportunityResearch.Requested(request):

  // 0. Preconditions
  context = LOAD_CONTEXT()
  IF context.missing_any:
     PUBLISH OpportunityResearch.Aborted(context.missing)
     RETURN
```

---

### 1. Normalize Request → Research Brief

```pseudo
  research_brief = CREATE_RESEARCH_BRIEF(
      request,
      context.strategy_profile
  )

  PUBLISH OpportunityResearch.BriefCreated(research_brief)
```

---

### 2. Ingest Prior Learnings (Anti-Repeat)

```pseudo
  prior_cases = MEMORY.QUERY_SIMILAR(
      niche=research_brief.niche,
      season=research_brief.season,
      price_band=research_brief.price_band
  )

  risk_adjustments = EXTRACT_RISK_ADJUSTMENTS(prior_cases)

  APPLY_ADJUSTMENTS_TO_CONTEXT(risk_adjustments)

  PUBLISH OpportunityResearch.PriorLearningsAttached(
      references=prior_cases.ids
  )
```

---

### 3. Multi-Signal Discovery (via MCP)

```pseudo
  signals = {}

  signals.social = MCP.SOCIAL.SCAN(
      keywords=research_brief.keywords,
      timeframe=research_brief.timeframe,
      geo=research_brief.geo
  )

  signals.search = MCP.SEARCH.QUERY(
      seed_terms=research_brief.seed_terms,
      timeframe=research_brief.timeframe,
      geo=research_brief.geo
  )

  signals.marketplace = MCP.MARKETPLACE.MOVERS(
      category=research_brief.category,
      timeframe=research_brief.timeframe
  )

  signals.ads = MCP.ADS.COMPETITOR_SCAN(
      keywords=research_brief.keywords,
      timeframe=research_brief.timeframe
  )

  signals.supplier = MCP.SUPPLIER.CATALOG_SCAN(
      keywords=research_brief.keywords
  )

  evidence_refs = STORE_EVIDENCE(signals)

  PUBLISH OpportunityResearch.SignalsCollected(evidence_refs)
```

---

### 4. Theme Generation

```pseudo
  themes = GENERATE_THEMES_FROM_SIGNALS(signals)

  themes = DEDUPE_AND_CLUSTER(themes)

  themes = ATTACH_SIGNAL_SUPPORT(themes, signals)

  themes = LABEL_CERTAINTY(themes)

  PUBLISH OpportunityResearch.ThemesGenerated(themes.summary)
```

---

### 5. Hard-Gate Filtering

```pseudo
  passed = []
  rejected = []

  FOR theme IN themes:
     IF VIOLATES_BLACKLIST(theme, context.risk_blacklist):
         rejected.add(theme, reason="blacklist")
         CONTINUE

     IF FULFILLMENT_RISK(theme, context.strategy_profile):
         rejected.add(theme, reason="fulfillment")
         CONTINUE

     IF NO_CLEAR_PROBLEM(theme, signals):
         rejected.add(theme, reason="weak_problem")
         CONTINUE

     IF STRATEGY_MISMATCH(theme, context.strategy_profile):
         rejected.add(theme, reason="strategy")
         CONTINUE

     passed.append(theme)

  PUBLISH OpportunityResearch.ThemesGated(
      passed_count=passed.count,
      rejection_summary=SUMMARY(rejected)
  )
```

---

### 6. Preliminary Scoring & Ranking

```pseudo
  scored = []

  FOR theme IN passed:
     scorecard = SCORE_THEME(
         theme,
         signals,
         context.scoring_rubric,
         context.adjustments
     )

     scored.append({
         theme: theme,
         scorecard: scorecard,
         total_score: WEIGHTED_SUM(scorecard)
     })

  ranked = SORT_DESC(scored, by=total_score)

  shortlist = TAKE_TOP(ranked, 10)

  PUBLISH OpportunityResearch.ShortlistRanked(shortlist)
```

---

### 7. Time & Cycle Fitness

```pseudo
  time_fit = []

  FOR item IN shortlist:
     cycle = ESTIMATE_TREND_CYCLE(item.theme, signals)

     IF cycle.window < context.validation_constraints.min_window:
         CONTINUE

     IF cycle.phase == "late" AND item.scorecard.saturation_high:
         CONTINUE

     time_fit.append({item, cycle})

  PUBLISH OpportunityResearch.TimeFiltered(time_fit)
```

---

### 8. Deep Validation

```pseudo
  validated = []

  FOR candidate IN TAKE_TOP(time_fit, 5):

     samples = {
        social: MCP.CONTENT.SAMPLE("social", candidate.theme, n=30),
        search: MCP.CONTENT.SAMPLE("search", candidate.theme, n=20),
        market: MCP.CONTENT.SAMPLE("marketplace", candidate.theme, n=20),
        ads:    MCP.CONTENT.SAMPLE("ads", candidate.theme, n=20)
     }

     IF NOT CONFIRM_REAL_PROBLEM(samples):
         CONTINUE

     competition = ASSESS_COMPETITION_QUALITY(samples)
     price_band = INFER_PRICE_BAND(samples.market)
     op_risk = ESTIMATE_OP_RISK(candidate.theme, samples, prior_cases)

     IF op_risk == "unacceptable":
         CONTINUE

     validated.append({
         candidate: candidate,
         samples_refs: STORE_EVIDENCE(samples),
         competition: competition,
         price_band: price_band,
         op_risk: op_risk
     })

  PUBLISH OpportunityResearch.ValidatedCandidatesReady(validated.summary)
```

---

### 9. Productization (Opportunity-Level)

```pseudo
  concepts = []

  FOR v IN validated:
     offer = DESIGN_OFFER(
         theme=v.candidate.theme,
         price_band=v.price_band,
         strategy=context.strategy_profile
     )

     supplier_proxy = MCP.SUPPLIER.QUICK_CHECK(offer.key_attributes)

     IF supplier_proxy.empty:
         CONTINUE

     concepts.append({
         validated: v,
         offer: offer,
         supplier_proxy_ref: STORE_EVIDENCE(supplier_proxy)
     })

  PUBLISH OpportunityResearch.OfferConceptsCreated(concepts.summary)
```

---

### 10. Opportunity Brief Creation

```pseudo
  briefs = []

  FOR item IN TAKE_TOP(concepts, 3):
     brief = BUILD_OPPORTUNITY_BRIEF(
         item,
         context.validation_constraints,
         certainty_labels=true
     )

     STORE_BRIEF(brief)
     briefs.append(brief)

  PUBLISH OpportunityResearch.BriefsPublished(briefs)
```

---

### 11. Handoffs (Events Only)

```pseudo
  PUBLISH Supplier.FeasibilityRequested(briefs)
  PUBLISH Marketing.AngleWhitespaceRequested(briefs)
  PUBLISH Operations.RiskReviewRequested(briefs)
  PUBLISH Analytics.ScoreReviewRequested(briefs)
```

---

## Learning Loop (Asynchronous)

```pseudo
ON EVENT Experiment.ResultsRecorded(result):

  brief = LOAD_BRIEF(result.brief_id)

  UPDATE_BRIEF_WITH_OUTCOME(brief, result)

  lessons = EXTRACT_LESSONS(result)

  MEMORY.WRITE(lessons)

  PUBLISH OpportunityResearch.LearningCaptured(
      brief_id=brief.id,
      lessons=lessons.summary
  )
```

---

## DEFINITION OF DONE (DOC 2)

- Execution matches **Document 1 checklist**
- All decisions are event-driven
- No downstream agent logic embedded
- No platform-specific assumptions
- Opportunity Briefs are the only “product”

---

**Document 2 complete.**

