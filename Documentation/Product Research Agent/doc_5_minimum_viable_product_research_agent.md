# DOCUMENT 5
## Minimum Viable Product Research Agent (MV-PRA)

---

## PURPOSE

The MV-PRA is the **leanest possible implementation** of the Product Research Agent that:

- avoids bad products
- produces credible Opportunity Briefs
- supports downstream agents
- learns from outcomes
- can be expanded later **without rewrites**

If you build only what’s in this document, the system will still work.

---

## CORE PRINCIPLE

> **Cut breadth, not structure.**  
> Keep the *thinking loop*, reduce the *number of inputs*.

Most failures come from removing gates, memory, or validation — **not** from having fewer data sources.

---

## WHAT STAYS (NON-NEGOTIABLE)

These are **mandatory** even in the MV version.

### 1. EventBus-driven workflow
- `OpportunityResearch.Requested`
- `OpportunityResearch.BriefsPublished`
- Downstream handoff events

**Why:** keeps architecture stable as you scale.

---

### 2. Hard gates + kill criteria
- Risk blacklist
- Fulfillment sanity checks
- Strategy alignment
- Explicit kill rules in the brief

**Why:** this is what prevents catastrophic mistakes.

---

### 3. Opportunity Brief (strict schema)
- You may simplify *content*, but not *structure*
- Every brief must still have:
  - problem
  - why now
  - price band
  - risks
  - validation plan
  - kill criteria
  - evidence references

**Why:** this is the contract that keeps agents aligned.

---

### 4. Learning loop (write-back only)
- Attach outcomes to briefs
- Record “why it failed / worked”
- Read prior failures before new runs

**Why:** without this, the agent never improves.

---

## WHAT GETS REDUCED (SAFE CUTS)

These cuts reduce complexity **without breaking logic**.

---

### 1. Signal sources → reduce to 3 (from 5)

**Keep only:**
- Social momentum  
- Search intent  
- Marketplace movement  

**Cut (for now):**
- Competitive ads (optional in MV)
- Supplier ecosystem deep scans (keep only light check)

**Why:**  
These three give you:
- discovery (social)
- intent (search)
- willingness to pay (marketplace)

That’s enough to make decent calls early.

---

### 2. Theme volume → reduce aggressively

**Full version:** 30–100 themes  
**MV version:** 10–20 themes

Then shortlist to:
- top 5
- deep-validate top 2–3
- publish **1–2 briefs max**

**Why:** early systems drown in options and stall.

---

### 3. Time & cycle modeling → heuristic only

**Full version:** phase + window length  
**MV version:** simple rule-based checks:
- Is growth accelerating over last X weeks?
- Is saturation obviously high?

Skip precise window estimation.

---

### 4. Qualitative sampling → cap volume

**Full version:** 20–30 samples per source  
**MV version:** 5–10 per source

Still required, just smaller.

---

### 5. Supplier checks → existence only

**MV rule:**  
- “Can I find multiple suppliers offering this?”
- “Is price floor non-zero?”
- “Is shipping plausible?”

Do **not** attempt:
- QC evaluation
- MOQ negotiation
- branding options

That’s Supplier Agent territory later.

---

## WHAT GETS POSTPONED (DO NOT BUILD YET)

These add value later but are **not required to launch**.

- Competitive ad creative analysis
- Angle whitespace quantification
- Trend cycle modeling beyond heuristics
- Automated scoring weight optimization
- Cross-market geo comparison
- Advanced bias correction

All can be layered on **after** you see real outcomes.

---

## MV-PRA CHECKLIST (COMPRESSED)

For each request, the MV agent must:

1. Load strategy, blacklist, constraints, memory  
2. Create Research Brief  
3. Pull prior failures  
4. Collect 3 signal types (social/search/marketplace)  
5. Generate 10–20 themes  
6. Hard-gate aggressively  
7. Score + shortlist top 5  
8. Deep-validate top 2–3  
9. Productize into offers  
10. Publish 1–2 Opportunity Briefs  
11. Emit handoff events  
12. Ingest outcomes later

If all 12 happen → the agent did its job.

---

## EXPANSION PATH (IMPORTANT)

You can evolve MV-PRA → Full PRA by:

1. Adding signal sources (ads, suppliers)
2. Increasing theme breadth
3. Improving time/cycle modeling
4. Refining scoring with Analytics
5. Adding richer qualitative analysis

**No rewrites required** if you keep the structure.

---

## DEFINITION OF DONE (DOC 5)

You are ready to ship the Product Research Agent when:

- MV-PRA can run end-to-end unattended
- It publishes Opportunity Briefs consistently
- Bad products are filtered early
- Learning artifacts accumulate
- Other agents can act without clarification

---

## FINAL NOTE

What you’ve designed is **not** a “trend finder.”  
It’s a **decision system under uncertainty**.

The MV-PRA gives you:
- speed
- safety
- compounding learning

Everything else is optimization.

---

**Document 5 complete.**

