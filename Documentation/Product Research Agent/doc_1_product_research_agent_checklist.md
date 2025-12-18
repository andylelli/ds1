# DOCUMENT 1
## Product Research (Opportunity) Agent — Operational Checklist
*(Agent-specific, EventBus-driven, MCP-aware)*

---

### PURPOSE OF THIS CHECKLIST
This checklist defines **exactly what the Product Research Agent must do, in what order, and under what conditions it may proceed or must stop**.

It applies **only** to the Product Research (Opportunity) Agent.  
It assumes:
- external access via **MCP**
- inter-agent coordination via an **EventBus**
- no authority to approve or launch products

The agent’s only mandate is to **identify, validate, and package product opportunities**.

---

## 0. PRECONDITIONS (HARD STOP)

Before processing any request, the agent must load:

- ☐ **Strategy Profile**
- ☐ **Risk Blacklist**
- ☐ **Validation Constraints**
- ☐ **Scoring Rubric**
- ☐ **Enterprise Memory (opportunity-level slices only)**

**Failure behavior**
- If any are missing → emit `OpportunityResearch.Aborted`
- Include missing dependency list
- Perform no research

---

## 1. REQUEST INTAKE & NORMALIZATION

Trigger: `OpportunityResearch.Requested`

The agent must:

- ☐ Parse request fields (niche, season, geo, risk posture, speed)
- ☐ Translate into a **Research Brief**:
  - seasonal window (start / peak / decay)
  - target persona(s)
  - category constraints
  - definition of “emerging” (time + growth)
  - execution speed assumptions
- ☐ Validate alignment with Strategy Profile

**Output**
- Emit `OpportunityResearch.BriefCreated`
- Include Research Brief only (no conclusions)

---

## 2. PRIOR LEARNING INGESTION (ANTI-REPEAT)

The agent must:

- ☐ Query Enterprise Memory for:
  - similar niches
  - similar seasons
  - similar price bands
  - prior failures and success patterns
- ☐ Extract **risk adjustments** (penalties, exclusions, warnings)
- ☐ Attach adjustments to scoring context

**Output**
- Emit `OpportunityResearch.PriorLearningsAttached`
- Reference memory artifacts used

---

## 3. MULTI-SIGNAL DISCOVERY (WIDE SCAN)

The agent must collect **at least two** signal families via MCP.

Allowed families:
- Social momentum
- Search intent
- Marketplace movement
- Competitive advertising
- Supplier ecosystem

For each signal:
- ☐ Record source
- ☐ Record time window
- ☐ Record retrieval timestamp

**Rules**
- No interpretation yet
- No scoring yet

**Output**
- Emit `OpportunityResearch.SignalsCollected`
- Include evidence references only

---

## 4. THEME GENERATION (NOT PRODUCTS)

The agent must:

- ☐ Generate 30–100 **themes** (problem/solution level)
- ☐ Cluster and de-duplicate themes
- ☐ Attach supporting signal types per theme
- ☐ Label certainty per theme:
  - Observed
  - Inferred
  - Assumed

**Output**
- Emit `OpportunityResearch.ThemesGenerated`
- Include theme list + metadata

---

## 5. HARD-GATE FILTERING (IMMEDIATE REJECTS)

For each theme, the agent must reject if:

- ☐ Violates Risk Blacklist
- ☐ Obvious fulfillment risk (fragile, bulky, hazmat, etc.)
- ☐ No clear problem signal
- ☐ Strategy mismatch (brand, geo, price, customer)

**Rules**
- Rejected themes do not proceed
- Reasons must be recorded

**Output**
- Emit `OpportunityResearch.ThemesGated`
- Include pass count + rejection reasons summary

---

## 6. PRELIMINARY SCORING & RANKING

For each remaining theme:

- ☐ Score using Scoring Rubric:
  - demand acceleration
  - problem clarity
  - competition saturation
  - creative whitespace
  - differentiation potential
  - operational risk proxy
  - supplier feasibility proxy
- ☐ Apply prior-learning adjustments
- ☐ Rank themes **relatively**

**Output**
- Emit `OpportunityResearch.ShortlistRanked`
- Top 10 themes only

---

## 7. TIME & CYCLE FITNESS CHECK

For each shortlisted theme:

- ☐ Estimate trend phase (early / mid / late)
- ☐ Estimate opportunity window length
- ☐ Compare window to execution speed
- ☐ Reject if window < time-to-test

**Output**
- Emit `OpportunityResearch.TimeFiltered`
- Include surviving themes + cycle notes

---

## 8. DEEP VALIDATION (FOCUSED SCAN)

For top 3–5 themes:

- ☐ Collect qualitative samples (comments, reviews, ads)
- ☐ Confirm real user problem language
- ☐ Assess competition quality
- ☐ Infer acceptable price band
- ☐ Identify operational and CS risks
- ☐ Note signal bias/blind spots

**Output**
- Emit `OpportunityResearch.ValidatedCandidatesReady`

---

## 9. PRODUCTIZATION (OPPORTUNITY-LEVEL)

For each validated theme:

- ☐ Define offer concept:
  - core product hypothesis
  - bundle / upsell options
  - persona + usage scenario
  - differentiation approach
- ☐ Perform light supplier sanity check (availability exists)

**Output**
- Emit `OpportunityResearch.OfferConceptsCreated`

---

## 10. OPPORTUNITY BRIEF CREATION (REQUIRED OUTPUT)

For top 1–3 concepts:

- ☐ Create **Opportunity Brief** (strict schema)
- ☐ Attach evidence references
- ☐ Attach certainty labels
- ☐ Define validation plan + kill criteria

**Rules**
- No brief → no handoff
- Brief is the **only** valid product research output

**Output**
- Emit `OpportunityResearch.BriefsPublished`

---

## 11. HANDOFF VIA EVENTS (NO DECISIONS)

The agent must publish:

- ☐ `Supplier.FeasibilityRequested`
- ☐ `Marketing.AngleWhitespaceRequested`
- ☐ `Operations.RiskReviewRequested`
- ☐ `Analytics.ScoreReviewRequested`

**Rule**
- Product Research Agent never approves or launches

---

## 12. POST-OUTCOME LEARNING INGESTION

On downstream outcome events:

- ☐ Link outcome to original brief
- ☐ Extract learning tags
- ☐ Write to Enterprise Memory
- ☐ Do not modify global scoring (Analytics owns that)

**Output**
- Emit `OpportunityResearch.LearningCaptured`

---

## DEFINITION OF DONE (DOC 1)

The Product Research Agent has done its job **only when**:
- Opportunity Briefs are published
- Evidence is attached
- Validation paths are defined
- Handoffs are emitted
- Learning hooks are in place

---

**Document 1 complete.**

