# DOCUMENT 6
## External Endpoints to Integrate + High-Level Integration Approach
*(Product Research / Opportunity Agent – MCP + EventBus context)*

---

## Purpose
This document lists the **external endpoints (by name)** that give the Product Research Agent a comprehensive view of what will sell, and explains **how to integrate at a high level** (auth, query pattern, data returned, normalization via MCP).

Scope is **opportunity discovery + validation signals** only (not ad buying, store build, fulfillment ops).

---

## Integration Philosophy (for this agent)
- Treat each platform as a **signal source**, not a source of truth.
- Prefer **official APIs** where practical.
- Pull **time-series snapshots** to measure *velocity* (emerging vs static demand).
- Normalize all outputs into the **Standard MCP Tool Contract (Doc 4)**.

---

## Priority Tiers (what to integrate first)

### Tier 1 (MVP: enough to find/validate opportunities)
1) **Google Ads API – Keyword Planning** (search intent)
2) **YouTube Data API v3** (how-to intent + product discovery)
3) **Shopify Admin API** (your own ground truth once you test)
4) **Meta Graph API – Ads Archive / Ad Library** (saturation + creative patterns)

### Tier 2 (stronger coverage)
5) **Instagram Graph API – Hashtag Search + Hashtag Media** (social discovery)
6) **Pinterest REST API v5** (seasonal intent, especially home/garden)

### Tier 3 (nice-to-have / depends on access)
7) **TikTok Business API / Marketing API** (mostly for your own ads + reporting)
8) **Amazon Selling Partner API (SP-API)** (price bands + listing density)
9) **Alibaba Open Platform** (supplier ecosystem / availability signals)

---

## Endpoint Catalog (names + what they’re for)

### 1) Meta (Facebook/Instagram) — Ad Library / Competitive Ads
**Endpoint name:** Graph API `ads_archive` (Ads Archive)  
**Use:** competitor ads discovery, creative iteration velocity, saturation proxies.

**High-level integration pattern:**
- Create a Meta developer app
- Obtain access token (system user / app review as required)
- Query `ads_archive` by keywords + geo + time window
- Paginate results; store ad snapshots for trend/refresh analysis

**How it plugs into MCP:**
- `mcp.ads.scan(query, timeframe, geo)` returns `signal_type=ads`
- `items[]` represent ads with metrics proxies + creative/hook text where available

---

### 2) Instagram — Hashtag Trend Scanning
**Endpoint name:** `ig_hashtag_search` (IG Hashtag Search)  
**Related endpoints:** `/{ig-hashtag-id}/top_media`, `/{ig-hashtag-id}/recent_media`  
**Use:** emerging formats + themes, qualitative problem language.

**High-level integration pattern:**
- Meta app + Instagram Graph API access
- Search hashtag → get hashtag ID
- Pull recent/top media for that hashtag
- Extract repeated product/problem language, engagement proxies, creator count

**How it plugs into MCP:**
- `mcp.social.scan(query, timeframe, geo)` can use hashtag clusters
- `mcp.social.sample(query, limit)` fetches representative media samples

---

### 3) Google — Search Intent (Keyword Planner)
**Endpoint name:** Google Ads API `KeywordPlanIdeaService.GenerateKeywordIdeas`  
**Use:** keyword expansion + demand proxies + competition index.

**High-level integration pattern:**
- Google Ads account + developer token + OAuth
- Provide keyword seeds and/or URL seeds
- Provide location + language targeting
- Receive keyword ideas + historical metrics (volume ranges, competition)

**How it plugs into MCP:**
- `mcp.search.scan(seed_terms, timeframe, geo)` returns `signal_type=search`
- `items[]` represent query clusters with `growth_rate`, `seasonality_index`, etc.

---

### 4) YouTube — Discovery + How-to Demand
**Endpoint names:** YouTube Data API v3 `search.list`, `videos.list`  
**Use:** product discovery themes, tutorial-driven demand, evergreen problem signals.

**High-level integration pattern:**
- Google Cloud project + API key/OAuth
- Search by keyword clusters ("how to", "best", "review", problem phrasing)
- Fetch video stats for velocity proxies

**How it plugs into MCP:**
- Usually modeled as `signal_type=social` (or a separate internal source mapped to social)
- `items[]` are videos with engagement/velocity and extracted topic signals

---

### 5) Pinterest — Seasonal/Shopping Intent
**Endpoint family:** Pinterest REST API v5  
**Notable endpoint (limited access):** `trending_keywords/list` (may be alpha/limited)  
**Use:** seasonal topic discovery and keyword-driven purchase intent.

**High-level integration pattern:**
- Pinterest developer app + OAuth
- Pull trending keywords (if enabled) and/or search endpoints
- Derive seasonal clusters and product themes

**How it plugs into MCP:**
- Often mapped to `signal_type=search` (Pinterest behaves like a search engine)
- `items[]` are keywords/clusters with growth/interest proxies

---

### 6) Shopify — Your Ground Truth (post-launch learning)
**Endpoint family:** Shopify Admin API (REST or GraphQL)  
**Use:** real conversion, refunds, AOV, product-level outcomes.

**High-level integration pattern:**
- Create Shopify app/private app
- Grant scopes for orders/products/refunds
- Pull daily summaries and per-product metrics

**How it plugs into MCP:**
- Exposed as `mcp.storedata.scan(timeframe, geo)`
- Feeds the agent’s learning loop (brief outcomes, failure modes)

---

### 7) TikTok — (Optional) Business/Ads Reporting
**Endpoint family:** TikTok Business API / Marketing API  
**Use:** mostly your own account reporting + creative performance once you run ads.

**High-level integration pattern:**
- TikTok business app + OAuth
- Pull campaign/adgroup/ad metrics at set intervals

**How it plugs into MCP:**
- Typically maps to `signal_type=ads` for reporting, not discovery

---

### 8) Amazon — Marketplace Reality Checks
**Endpoint family:** Amazon Selling Partner API (SP-API)  
**Use:** listing density, price bands, review velocity proxies.

**High-level integration pattern:**
- Register developer + application
- Authenticate (AWS signing + tokens)
- Query catalog/search endpoints for categories and keywords

**How it plugs into MCP:**
- `signal_type=marketplace`
- `items[]` are listings/products with normalized price/review velocity fields

---

### 9) Alibaba — Supplier Ecosystem Signals
**Endpoint family:** Alibaba Open Platform / Open API  
**Use:** supplier count, variant spread, early manufacturing momentum.

**High-level integration pattern:**
- Register on Alibaba Open Platform
- Use provided auth method (keys/OAuth depending on program)
- Search supplier/product catalogs by attributes

**How it plugs into MCP:**
- `signal_type=supplier`
- `items[]` represent supplier offers with price floor + availability notes

---

## High-Level Technical Integration (common across all endpoints)

### A) Authentication
Most platforms use one of:
- OAuth2 access tokens (Meta, Google, Pinterest, Shopify, TikTok)
- Signed requests / AWS-style signing (Amazon SP-API)

**MCP connector responsibility:**
- handle token refresh
- manage scopes/permissions
- expose only the normalized outputs to the agent

### B) Query Pattern
- `scan(query, timeframe, geo)` for broad discovery
- `sample(query, limit)` for qualitative evidence
- paginate until:
  - limit reached, or
  - confidence drops, or
  - cost/rate-limit threshold hit

### C) Rate Limits & Reliability
- implement caching at the MCP layer
- store snapshots with timestamps
- degrade gracefully (return envelope + low confidence + notes)

### D) Normalization
Every connector must map raw platform results into:
- `McpResponse` envelope
- `SignalItem` base structure
- required metrics/qualitative fields per signal type (Doc 4)

### E) Evidence IDs
Every MCP response must produce stable `evidence_id` references so Opportunity Briefs can cite them.

---

## Recommended Build Order (practical)
1) Google Ads API (keyword ideas) → quickest search intent signal
2) Meta Ads Archive (`ads_archive`) → saturation + creative patterns
3) Marketplace (choose one) → price bands + buyer willingness
4) YouTube Data API → qualitative + evergreen demand
5) Instagram/Pinterest → seasonal discovery expansion
6) Supplier ecosystem integration (Alibaba) → feasibility momentum

---

## What “Comprehensive View” Means (for this agent)
You are “comprehensive enough” when each opportunity can be supported by:
- at least **2 signal families** (ideally 3)
- at least **one qualitative evidence set** (samples)
- at least **one pricing reality check** (marketplace)
- a **clear validation plan + kill criteria**

---

**Document 6 complete.**

