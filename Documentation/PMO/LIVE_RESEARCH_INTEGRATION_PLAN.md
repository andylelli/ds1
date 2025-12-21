# 🔬 Live Research Integration Plan

## Executive Summary

This document outlines the complete plan for integrating live research endpoints into the DS1 dropshipping system. The goal is to replace mock data with real market intelligence for product discovery, trend analysis, and competitor research.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Target Architecture](#2-target-architecture)
3. [Integration Priorities](#3-integration-priorities)
4. [Phase 1: Google Trends Integration](#4-phase-1-google-trends-integration)
5. [**Staging Area & Review Workflow**](#5-staging-area--review-workflow) ⭐ NEW
6. [Phase 2: Meta Ad Library Integration](#6-phase-2-meta-ad-library-integration)
7. [Phase 3: TikTok Creative Center](#7-phase-3-tiktok-creative-center)
8. [Phase 4: Premium Data Sources](#8-phase-4-premium-data-sources)
9. [Configuration & Environment Variables](#9-configuration--environment-variables)
10. [Error Handling & Fallbacks](#10-error-handling--fallbacks)
11. [Testing Strategy](#11-testing-strategy)
12. [Cost Analysis](#12-cost-analysis)
13. [Timeline & Milestones](#13-timeline--milestones)
14. [Risk Assessment](#14-risk-assessment)
15. [Success Metrics](#15-success-metrics)

---

## 1. Current State Analysis

### 1.1 Existing Port Interfaces

#### TrendAnalysisPort
**File:** `src/core/domain/ports/TrendAnalysisPort.ts`
```typescript
interface TrendAnalysisPort {
  analyzeTrend(category: string): Promise<any>;
  checkSaturation(productName: string): Promise<any>;
  findProducts(category: string): Promise<any[]>;
}
```

#### CompetitorAnalysisPort
**File:** `src/core/domain/ports/CompetitorAnalysisPort.ts`
```typescript
interface CompetitorAnalysisPort {
  analyzeCompetitors(category: string): Promise<any>;
  getCompetitorAds(competitorUrl: string): Promise<any[]>;
}
```

### 1.2 Current Adapter Implementations

| Adapter | File | Status | Description |
|---------|------|--------|-------------|
| `MockTrendAdapter` | `src/infra/trends/MockTrendAdapter.ts` | ✅ Working | Returns hardcoded mock products |
| `LiveTrendAdapter` | `src/infra/trends/LiveTrendAdapter.ts` | ⚠️ Partial | Uses AI to generate products (not real trend data) |
| `MockCompetitorAdapter` | `src/infra/research/MockCompetitorAdapter.ts` | ✅ Working | Returns hardcoded competitor data |
| `LiveCompetitorAdapter` | `src/infra/research/LiveCompetitorAdapter.ts` | ❌ Stub | Throws "not implemented" errors |

### 1.3 Configuration System

**File:** `src/infra/config/ConfigService.ts`

Current config keys:
- `trendsMode: 'mock' | 'live'` - Controls TrendAnalysisPort adapter
- `researchMode: 'mock' | 'live'` - Controls CompetitorAnalysisPort adapter

### 1.4 Agent Usage

**ProductResearchAgent** (`src/agents/ProductResearchAgent.ts`) uses both ports:
- `findWinningProducts()` → `TrendAnalysisPort.findProducts()`
- `analyzeNiche()` → `TrendAnalysisPort.analyzeTrend()` + `CompetitorAnalysisPort.analyzeCompetitors()`
- `analyzeCompetitors()` → `CompetitorAnalysisPort.analyzeCompetitors()`

---

## 2. Target Architecture

### 2.1 Adapter Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                     ProductResearchAgent                        │
├─────────────────────────────────────────────────────────────────┤
│  findWinningProducts()  │  analyzeNiche()  │  analyzeCompetitors()│
└────────────┬────────────┴────────┬─────────┴──────────┬─────────┘
             │                     │                    │
             ▼                     ▼                    ▼
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│  TrendAnalysisPort │  │  TrendAnalysisPort │  │CompetitorAnalysisPort│
└─────────┬──────────┘  └─────────┬──────────┘  └──────────┬─────────┘
          │                       │                        │
          ▼                       ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Adapter Layer                            │
├─────────────────┬─────────────────┬─────────────────────────────┤
│ MockTrendAdapter│ LiveTrendAdapter│ Mock/LiveCompetitorAdapter  │
│   (Static)      │ (Google Trends  │ (Meta Ad Library +          │
│                 │  + AI Interpret)│  AdSpy/BigSpy)              │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### 2.2 Data Flow for Live Mode

```
User Request: "Find winning products in Fitness"
                    │
                    ▼
┌───────────────────────────────────────────────────────────────┐
│ Step 1: Trend Analysis (Google Trends)                        │
│  - Query: "fitness equipment", "home gym", "resistance bands" │
│  - Output: Interest scores, rising queries, geographic data   │
└───────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────────────┐
│ Step 2: Competitor Intelligence (Meta Ad Library)             │
│  - Query: Ads containing "fitness" running >30 days           │
│  - Output: Proven products, ad creatives, competitor pages    │
└───────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────────────┐
│ Step 3: AI Synthesis (OpenAI)                                 │
│  - Input: Trend data + Competitor ads + Category context      │
│  - Output: Ranked product recommendations with reasoning      │
└───────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────────────┐
│ Step 4: Product Output                                        │
│  - Products with: name, potential, margin estimate, images    │
│  - Confidence score based on trend + competition data         │
└───────────────────────────────────────────────────────────────┘
```

---

## 3. Integration Priorities

### Priority Matrix

| Integration | Effort | Value | Cost | Priority |
|-------------|--------|-------|------|----------|
| Google Trends | Medium | High | Free | 🥇 P1 |
| Meta Ad Library | Medium | High | Free | 🥇 P1 |
| TikTok Creative Center | High | Medium | Free | 🥈 P2 |
| AdSpy/BigSpy | Low | Very High | $99-149/mo | 🥉 P3 |
| Exploding Topics | Low | High | $97/mo | 🥉 P3 |

### Recommended Order

1. **Phase 1:** Google Trends + Enhanced AI interpretation
2. **Phase 2:** Meta Ad Library for competitor intelligence
3. **Phase 3:** TikTok Creative Center (manual or scraped)
4. **Phase 4:** Premium APIs (AdSpy, Exploding Topics) if budget allows

---

## 4. Phase 1: Google Trends Integration

### 4.1 Overview

**Goal:** Replace AI-only product generation with real trend data + AI interpretation

**Package:** `google-trends-api` (unofficial but stable)

### 4.2 Installation

```bash
npm install google-trends-api
npm install --save-dev @types/google-trends-api
```

### 4.3 API Capabilities

| Method | Use Case | DS1 Mapping |
|--------|----------|-------------|
| `interestOverTime()` | Historical trend data | `analyzeTrend()` |
| `interestByRegion()` | Geographic interest | `analyzeTrend()` |
| `relatedQueries()` | Rising/top queries | `findProducts()` |
| `relatedTopics()` | Related product categories | `findProducts()` |
| `dailyTrends()` | Today's trending searches | `findProducts()` |
| `realTimeTrends()` | Live trending topics | `findProducts()` |

### 4.4 Implementation Plan

#### 4.4.1 Update LiveTrendAdapter

**File:** `src/infra/trends/LiveTrendAdapter.ts`

```typescript
import googleTrends from 'google-trends-api';
import { TrendAnalysisPort } from '../../core/domain/ports/TrendAnalysisPort.js';
import { openAIService } from '../ai/OpenAIService.js';

export class LiveTrendAdapter implements TrendAnalysisPort {
  
  async analyzeTrend(category: string): Promise<any> {
    // 1. Get interest over time from Google Trends
    const interestData = await this.getInterestOverTime(category);
    
    // 2. Get related queries (rising = opportunity)
    const relatedQueries = await this.getRelatedQueries(category);
    
    // 3. Calculate trend score
    const trendScore = this.calculateTrendScore(interestData);
    
    return {
      category,
      trendScore,           // 0-100
      direction: trendScore > 60 ? 'rising' : trendScore > 40 ? 'stable' : 'declining',
      interestOverTime: interestData,
      risingQueries: relatedQueries.rising,
      topQueries: relatedQueries.top,
      recommendation: trendScore > 50 ? 'PROCEED' : 'CAUTION'
    };
  }

  async checkSaturation(productName: string): Promise<any> {
    // High, stable interest = saturated
    // Rising interest = opportunity
    // Declining = avoid
    const interestData = await this.getInterestOverTime(productName);
    const recentTrend = this.analyzeRecentTrend(interestData);
    
    return {
      productName,
      saturationLevel: recentTrend.stable && recentTrend.high ? 'HIGH' : 
                       recentTrend.rising ? 'LOW' : 'MEDIUM',
      recommendation: recentTrend.rising ? 'OPPORTUNITY' : 
                      recentTrend.declining ? 'AVOID' : 'COMPETITIVE'
    };
  }

  async findProducts(category: string): Promise<any[]> {
    // 1. Get rising queries from Google Trends
    const { rising } = await this.getRelatedQueries(category);
    
    // 2. Get daily trends for the region
    const dailyTrends = await this.getDailyTrends();
    
    // 3. Use AI to synthesize into product recommendations
    const products = await this.synthesizeProductsWithAI(category, rising, dailyTrends);
    
    return products;
  }

  // --- Helper Methods ---
  
  private async getInterestOverTime(keyword: string): Promise<any> {
    const result = await googleTrends.interestOverTime({
      keyword,
      startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      geo: 'US'
    });
    return JSON.parse(result);
  }

  private async getRelatedQueries(keyword: string): Promise<any> {
    const result = await googleTrends.relatedQueries({ keyword, geo: 'US' });
    const parsed = JSON.parse(result);
    return {
      rising: parsed.default.rankedList[0]?.rankedKeyword || [],
      top: parsed.default.rankedList[1]?.rankedKeyword || []
    };
  }

  private async getDailyTrends(): Promise<any> {
    const result = await googleTrends.dailyTrends({ geo: 'US' });
    return JSON.parse(result);
  }

  private calculateTrendScore(interestData: any): number {
    // Analyze the timeline data to calculate a 0-100 score
    const timeline = interestData.default?.timelineData || [];
    if (timeline.length < 2) return 50;
    
    const recent = timeline.slice(-7).map((d: any) => d.value[0]);
    const older = timeline.slice(-30, -7).map((d: any) => d.value[0]);
    
    const recentAvg = recent.reduce((a: number, b: number) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a: number, b: number) => a + b, 0) / older.length;
    
    // If recent > older, trend is rising
    const growth = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    
    // Normalize to 0-100 scale
    return Math.min(100, Math.max(0, 50 + growth));
  }

  private analyzeRecentTrend(interestData: any): any {
    const score = this.calculateTrendScore(interestData);
    const timeline = interestData.default?.timelineData || [];
    const avgValue = timeline.length > 0 
      ? timeline.reduce((a: any, b: any) => a + b.value[0], 0) / timeline.length 
      : 50;
    
    return {
      rising: score > 60,
      stable: score >= 40 && score <= 60,
      declining: score < 40,
      high: avgValue > 70,
      low: avgValue < 30
    };
  }

  private async synthesizeProductsWithAI(
    category: string, 
    risingQueries: any[], 
    dailyTrends: any
  ): Promise<any[]> {
    const client = openAIService.getClient();
    
    const prompt = `You are an expert dropshipping product researcher.

Based on the following REAL Google Trends data, identify 3 specific products to sell in the "${category}" niche.

RISING SEARCH QUERIES (opportunity indicators):
${risingQueries.slice(0, 10).map((q: any) => `- "${q.query}" (${q.formattedValue} growth)`).join('\n')}

TODAY'S TRENDING TOPICS:
${dailyTrends.default?.trendingSearchesDays?.[0]?.trendingSearches?.slice(0, 5).map((t: any) => `- ${t.title.query}`).join('\n') || 'N/A'}

For each product, provide:
1. Specific product name (not generic)
2. Why it's trending NOW (cite the data above)
3. Estimated profit margin
4. Target audience
5. Confidence score (1-10)

Return ONLY valid JSON:
{
  "products": [
    {
      "id": "generated_id",
      "name": "Product Name",
      "description": "Why this is a winner based on trend data",
      "potential": "High/Medium/Low",
      "margin": "60%",
      "confidence": 8,
      "trendEvidence": "Based on rising query: X"
    }
  ]
}`;

    const result = await client.chat.completions.create({
      model: openAIService.deploymentName,
      messages: [
        { role: 'system', content: 'You are a data-driven product researcher. Base recommendations on the provided trend data.' },
        { role: 'user', content: prompt }
      ]
    });

    const content = result.choices[0].message.content || '{"products":[]}';
    const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);

    return data.products.map((p: any) => ({
      ...p,
      images: [`https://via.placeholder.com/600x600.png?text=${encodeURIComponent(p.name)}`],
      source: 'google_trends'
    }));
  }
}
```

### 4.5 Rate Limiting & Caching

Google Trends API has no official rate limits but can block excessive requests.

**Caching Strategy:**
```typescript
// Add to LiveTrendAdapter
private cache = new Map<string, { data: any; timestamp: number }>();
private CACHE_TTL = 1000 * 60 * 60; // 1 hour

private async cachedRequest<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = this.cache.get(key);
  if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetcher();
  this.cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

### 4.6 Fallback Strategy

If Google Trends fails, fall back to AI-only generation:

```typescript
async findProducts(category: string): Promise<any[]> {
  try {
    // Try Google Trends + AI
    const { rising } = await this.getRelatedQueries(category);
    const dailyTrends = await this.getDailyTrends();
    return await this.synthesizeProductsWithAI(category, rising, dailyTrends);
  } catch (error) {
    console.warn('[LiveTrendAdapter] Google Trends failed, falling back to AI-only:', error);
    return this.fallbackToAIOnly(category);
  }
}

private async fallbackToAIOnly(category: string): Promise<any[]> {
  // Current AI-only implementation as fallback
  // ... existing code ...
}
```

---

## 5. Staging Area & Review Workflow

### 5.1 Overview

**Goal:** Provide a human-in-the-loop review process where research results are staged for review before being used by the system. This ensures quality control and prevents AI hallucinations or low-quality suggestions from polluting the product pipeline.

**Key Principle:** Research results go to a staging area → Human reviews → Approved items proceed to main workflow

### 5.2 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Research Pipeline                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Google Trends ──┐                                              │
│                  │                                              │
│  Meta Ad Library ├──► STAGING AREA ──► HUMAN REVIEW ──► APPROVED│
│                  │    (Pending)         (Accept/Reject)  (Active)│
│  TikTok/AdSpy ───┘                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Review Dashboard                             │
├─────────────────────────────────────────────────────────────────┤
│  📋 Pending Items: 5                                            │
│  ────────────────────────────────────────────────────────────── │
│  │ Product Name       │ Source       │ Score │ Actions        │ │
│  │ LED Posture Belt   │ Google Trends│ 85    │ [✓] [✗] [?]   │ │
│  │ Resistance Band Set│ Meta Ads     │ 72    │ [✓] [✗] [?]   │ │
│  │ Smart Jump Rope    │ AI Synthesis │ 68    │ [✓] [✗] [?]   │ │
│  ────────────────────────────────────────────────────────────── │
│  [Approve All High-Score] [Reject All Low-Score] [Refresh]      │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Database Schema

**New Tables for Staging:**

```sql
-- Research staging table
CREATE TABLE research_staging (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(50) NOT NULL,           -- Links to research session
    item_type VARCHAR(50) NOT NULL,            -- 'product', 'trend', 'competitor'
    
    -- Core data
    name VARCHAR(255) NOT NULL,
    description TEXT,
    raw_data JSONB NOT NULL,                   -- Full API response
    
    -- Analysis results
    confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
    source VARCHAR(50) NOT NULL,               -- 'google_trends', 'meta_ads', 'ai_synthesis'
    trend_evidence TEXT,                       -- Why this item was flagged
    
    -- Review workflow
    status VARCHAR(20) DEFAULT 'pending',      -- 'pending', 'approved', 'rejected', 'needs_info'
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,                      -- Auto-expire old items
    
    CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'needs_info'))
);

-- Research sessions (groups of staging items)
CREATE TABLE research_sessions (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    research_type VARCHAR(50) NOT NULL,        -- 'product_discovery', 'trend_analysis', 'competitor'
    source_modes JSONB,                        -- Which adapters were used
    
    -- Summary stats
    total_items INTEGER DEFAULT 0,
    pending_items INTEGER DEFAULT 0,
    approved_items INTEGER DEFAULT 0,
    rejected_items INTEGER DEFAULT 0,
    
    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    
    status VARCHAR(20) DEFAULT 'in_progress'   -- 'in_progress', 'awaiting_review', 'reviewed', 'expired'
);

-- Index for quick lookups
CREATE INDEX idx_staging_status ON research_staging(status);
CREATE INDEX idx_staging_session ON research_staging(session_id);
CREATE INDEX idx_staging_type ON research_staging(item_type);
CREATE INDEX idx_sessions_status ON research_sessions(status);
```

### 5.4 Staging Service Implementation

**File:** `src/core/services/ResearchStagingService.ts`

```typescript
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export interface StagedItem {
  id: number;
  sessionId: string;
  itemType: 'product' | 'trend' | 'competitor';
  name: string;
  description: string;
  rawData: any;
  confidenceScore: number;
  source: string;
  trendEvidence: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_info';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
}

export interface ResearchSession {
  id: string;
  category: string;
  researchType: string;
  sourceModes: { trends: string; research: string };
  totalItems: number;
  pendingItems: number;
  approvedItems: number;
  rejectedItems: number;
  status: string;
  startedAt: Date;
}

export class ResearchStagingService {
  constructor(private pool: Pool) {}

  // === Session Management ===

  async createSession(category: string, researchType: string, sourceModes: any): Promise<string> {
    const sessionId = `research_${uuidv4().slice(0, 8)}`;
    
    await this.pool.query(`
      INSERT INTO research_sessions (id, category, research_type, source_modes, status)
      VALUES ($1, $2, $3, $4, 'in_progress')
    `, [sessionId, category, researchType, JSON.stringify(sourceModes)]);
    
    return sessionId;
  }

  async getSession(sessionId: string): Promise<ResearchSession | null> {
    const result = await this.pool.query(`
      SELECT * FROM research_sessions WHERE id = $1
    `, [sessionId]);
    
    return result.rows[0] ? this.mapSession(result.rows[0]) : null;
  }

  async getAllSessions(status?: string): Promise<ResearchSession[]> {
    let query = 'SELECT * FROM research_sessions';
    const params: any[] = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY started_at DESC LIMIT 50';
    
    const result = await this.pool.query(query, params);
    return result.rows.map(r => this.mapSession(r));
  }

  async completeSession(sessionId: string): Promise<void> {
    await this.pool.query(`
      UPDATE research_sessions 
      SET status = 'awaiting_review', completed_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [sessionId]);
  }

  // === Staging Items ===

  async stageItem(sessionId: string, item: Partial<StagedItem>): Promise<number> {
    const result = await this.pool.query(`
      INSERT INTO research_staging 
        (session_id, item_type, name, description, raw_data, confidence_score, source, trend_evidence, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP + INTERVAL '7 days')
      RETURNING id
    `, [
      sessionId,
      item.itemType,
      item.name,
      item.description,
      JSON.stringify(item.rawData),
      item.confidenceScore,
      item.source,
      item.trendEvidence
    ]);
    
    // Update session counters
    await this.pool.query(`
      UPDATE research_sessions 
      SET total_items = total_items + 1, pending_items = pending_items + 1
      WHERE id = $1
    `, [sessionId]);
    
    return result.rows[0].id;
  }

  async stageMultiple(sessionId: string, items: Partial<StagedItem>[]): Promise<number[]> {
    const ids: number[] = [];
    for (const item of items) {
      const id = await this.stageItem(sessionId, item);
      ids.push(id);
    }
    return ids;
  }

  async getStagedItems(sessionId?: string, status?: string): Promise<StagedItem[]> {
    let query = 'SELECT * FROM research_staging WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (sessionId) {
      query += ` AND session_id = $${paramIndex++}`;
      params.push(sessionId);
    }
    
    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    
    query += ' ORDER BY confidence_score DESC, created_at DESC';
    
    const result = await this.pool.query(query, params);
    return result.rows.map(r => this.mapStagedItem(r));
  }

  async getPendingCount(): Promise<number> {
    const result = await this.pool.query(`
      SELECT COUNT(*) FROM research_staging WHERE status = 'pending'
    `);
    return parseInt(result.rows[0].count);
  }

  // === Review Actions ===

  async approveItem(itemId: number, reviewedBy: string, notes?: string): Promise<void> {
    await this.updateItemStatus(itemId, 'approved', reviewedBy, notes);
  }

  async rejectItem(itemId: number, reviewedBy: string, notes?: string): Promise<void> {
    await this.updateItemStatus(itemId, 'rejected', reviewedBy, notes);
  }

  async requestMoreInfo(itemId: number, reviewedBy: string, notes: string): Promise<void> {
    await this.updateItemStatus(itemId, 'needs_info', reviewedBy, notes);
  }

  async bulkApprove(itemIds: number[], reviewedBy: string): Promise<void> {
    for (const id of itemIds) {
      await this.approveItem(id, reviewedBy, 'Bulk approved');
    }
  }

  async bulkReject(itemIds: number[], reviewedBy: string): Promise<void> {
    for (const id of itemIds) {
      await this.rejectItem(id, reviewedBy, 'Bulk rejected');
    }
  }

  async approveHighScore(sessionId: string, threshold: number, reviewedBy: string): Promise<number> {
    const result = await this.pool.query(`
      UPDATE research_staging 
      SET status = 'approved', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, review_notes = 'Auto-approved (high score)'
      WHERE session_id = $2 AND status = 'pending' AND confidence_score >= $3
      RETURNING id
    `, [reviewedBy, sessionId, threshold]);
    
    await this.updateSessionCounters(sessionId);
    return result.rowCount || 0;
  }

  async rejectLowScore(sessionId: string, threshold: number, reviewedBy: string): Promise<number> {
    const result = await this.pool.query(`
      UPDATE research_staging 
      SET status = 'rejected', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, review_notes = 'Auto-rejected (low score)'
      WHERE session_id = $2 AND status = 'pending' AND confidence_score < $3
      RETURNING id
    `, [reviewedBy, sessionId, threshold]);
    
    await this.updateSessionCounters(sessionId);
    return result.rowCount || 0;
  }

  // === Get Approved Items for Use ===

  async getApprovedProducts(sessionId?: string): Promise<any[]> {
    let query = `
      SELECT raw_data, name, description, confidence_score, source, trend_evidence
      FROM research_staging 
      WHERE status = 'approved' AND item_type = 'product'
    `;
    const params: any[] = [];
    
    if (sessionId) {
      query += ' AND session_id = $1';
      params.push(sessionId);
    }
    
    query += ' ORDER BY confidence_score DESC';
    
    const result = await this.pool.query(query, params);
    return result.rows.map(r => ({
      ...r.raw_data,
      name: r.name,
      description: r.description,
      confidenceScore: r.confidence_score,
      source: r.source,
      reviewStatus: 'approved'
    }));
  }

  // === Private Helpers ===

  private async updateItemStatus(itemId: number, status: string, reviewedBy: string, notes?: string): Promise<void> {
    const item = await this.pool.query('SELECT session_id FROM research_staging WHERE id = $1', [itemId]);
    
    await this.pool.query(`
      UPDATE research_staging 
      SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, review_notes = $3
      WHERE id = $4
    `, [status, reviewedBy, notes, itemId]);
    
    if (item.rows[0]) {
      await this.updateSessionCounters(item.rows[0].session_id);
    }
  }

  private async updateSessionCounters(sessionId: string): Promise<void> {
    await this.pool.query(`
      UPDATE research_sessions SET
        pending_items = (SELECT COUNT(*) FROM research_staging WHERE session_id = $1 AND status = 'pending'),
        approved_items = (SELECT COUNT(*) FROM research_staging WHERE session_id = $1 AND status = 'approved'),
        rejected_items = (SELECT COUNT(*) FROM research_staging WHERE session_id = $1 AND status = 'rejected')
      WHERE id = $1
    `, [sessionId]);
    
    // Check if fully reviewed
    const session = await this.getSession(sessionId);
    if (session && session.pendingItems === 0) {
      await this.pool.query(`
        UPDATE research_sessions SET status = 'reviewed', reviewed_at = CURRENT_TIMESTAMP WHERE id = $1
      `, [sessionId]);
    }
  }

  private mapSession(row: any): ResearchSession {
    return {
      id: row.id,
      category: row.category,
      researchType: row.research_type,
      sourceModes: row.source_modes,
      totalItems: row.total_items,
      pendingItems: row.pending_items,
      approvedItems: row.approved_items,
      rejectedItems: row.rejected_items,
      status: row.status,
      startedAt: row.started_at
    };
  }

  private mapStagedItem(row: any): StagedItem {
    return {
      id: row.id,
      sessionId: row.session_id,
      itemType: row.item_type,
      name: row.name,
      description: row.description,
      rawData: row.raw_data,
      confidenceScore: row.confidence_score,
      source: row.source,
      trendEvidence: row.trend_evidence,
      status: row.status,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      reviewNotes: row.review_notes,
      createdAt: row.created_at
    };
  }
}
```

### 5.5 Updated LiveTrendAdapter with Staging

**Modified `findProducts()` to stage results instead of returning directly:**

```typescript
import { ResearchStagingService } from '../../core/services/ResearchStagingService.js';

export class LiveTrendAdapter implements TrendAnalysisPort {
  private stagingService: ResearchStagingService;
  private stagingEnabled: boolean;

  constructor(pool: Pool, stagingEnabled = true) {
    this.stagingService = new ResearchStagingService(pool);
    this.stagingEnabled = stagingEnabled;
  }

  async findProducts(category: string): Promise<any[]> {
    // 1. Gather trend data
    const { rising } = await this.getRelatedQueries(category);
    const dailyTrends = await this.getDailyTrends();
    
    // 2. AI synthesizes products
    const products = await this.synthesizeProductsWithAI(category, rising, dailyTrends);
    
    // 3. If staging enabled, put in staging area
    if (this.stagingEnabled) {
      const sessionId = await this.stagingService.createSession(
        category, 
        'product_discovery',
        { trends: 'live', research: 'live' }
      );
      
      for (const product of products) {
        await this.stagingService.stageItem(sessionId, {
          itemType: 'product',
          name: product.name,
          description: product.description,
          rawData: product,
          confidenceScore: product.confidence * 10, // Convert 1-10 to 0-100
          source: 'google_trends',
          trendEvidence: product.trendEvidence || 'AI-synthesized from trend data'
        });
      }
      
      await this.stagingService.completeSession(sessionId);
      
      // Return indication that items are staged
      return [{
        staged: true,
        sessionId,
        itemCount: products.length,
        message: `${products.length} products staged for review. Session: ${sessionId}`
      }];
    }
    
    // 4. If staging disabled, return directly (legacy behavior)
    return products;
  }

  // Method to get only approved products
  async getApprovedProducts(sessionId?: string): Promise<any[]> {
    return this.stagingService.getApprovedProducts(sessionId);
  }
}
```

### 5.6 API Endpoints for Staging

**File:** `src/api/staging-routes.ts`

```typescript
import { Router } from 'express';
import { ResearchStagingService } from '../core/services/ResearchStagingService.js';

export function createStagingRoutes(pool: Pool): Router {
  const router = Router();
  const stagingService = new ResearchStagingService(pool);

  // === Sessions ===

  // GET /api/staging/sessions - List all research sessions
  router.get('/sessions', async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const sessions = await stagingService.getAllSessions(status);
      res.json({ sessions });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get sessions' });
    }
  });

  // GET /api/staging/sessions/:id - Get session details
  router.get('/sessions/:id', async (req, res) => {
    try {
      const session = await stagingService.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      const items = await stagingService.getStagedItems(req.params.id);
      res.json({ session, items });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get session' });
    }
  });

  // === Items ===

  // GET /api/staging/items - Get all staged items
  router.get('/items', async (req, res) => {
    try {
      const { sessionId, status } = req.query;
      const items = await stagingService.getStagedItems(
        sessionId as string | undefined,
        status as string | undefined
      );
      res.json({ items, count: items.length });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get items' });
    }
  });

  // GET /api/staging/pending - Get pending count
  router.get('/pending', async (req, res) => {
    try {
      const count = await stagingService.getPendingCount();
      res.json({ pendingCount: count });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get pending count' });
    }
  });

  // === Review Actions ===

  // POST /api/staging/items/:id/approve
  router.post('/items/:id/approve', async (req, res) => {
    try {
      const { reviewedBy = 'admin', notes } = req.body;
      await stagingService.approveItem(parseInt(req.params.id), reviewedBy, notes);
      res.json({ success: true, message: 'Item approved' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to approve item' });
    }
  });

  // POST /api/staging/items/:id/reject
  router.post('/items/:id/reject', async (req, res) => {
    try {
      const { reviewedBy = 'admin', notes } = req.body;
      await stagingService.rejectItem(parseInt(req.params.id), reviewedBy, notes);
      res.json({ success: true, message: 'Item rejected' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reject item' });
    }
  });

  // POST /api/staging/items/:id/need-info
  router.post('/items/:id/need-info', async (req, res) => {
    try {
      const { reviewedBy = 'admin', notes } = req.body;
      await stagingService.requestMoreInfo(parseInt(req.params.id), reviewedBy, notes);
      res.json({ success: true, message: 'Marked as needs info' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update item' });
    }
  });

  // === Bulk Actions ===

  // POST /api/staging/bulk/approve
  router.post('/bulk/approve', async (req, res) => {
    try {
      const { itemIds, reviewedBy = 'admin' } = req.body;
      await stagingService.bulkApprove(itemIds, reviewedBy);
      res.json({ success: true, message: `${itemIds.length} items approved` });
    } catch (error) {
      res.status(500).json({ error: 'Failed to bulk approve' });
    }
  });

  // POST /api/staging/bulk/reject
  router.post('/bulk/reject', async (req, res) => {
    try {
      const { itemIds, reviewedBy = 'admin' } = req.body;
      await stagingService.bulkReject(itemIds, reviewedBy);
      res.json({ success: true, message: `${itemIds.length} items rejected` });
    } catch (error) {
      res.status(500).json({ error: 'Failed to bulk reject' });
    }
  });

  // POST /api/staging/sessions/:id/auto-approve
  router.post('/sessions/:id/auto-approve', async (req, res) => {
    try {
      const { threshold = 70, reviewedBy = 'admin' } = req.body;
      const count = await stagingService.approveHighScore(req.params.id, threshold, reviewedBy);
      res.json({ success: true, message: `${count} items auto-approved (score >= ${threshold})` });
    } catch (error) {
      res.status(500).json({ error: 'Failed to auto-approve' });
    }
  });

  // POST /api/staging/sessions/:id/auto-reject
  router.post('/sessions/:id/auto-reject', async (req, res) => {
    try {
      const { threshold = 40, reviewedBy = 'admin' } = req.body;
      const count = await stagingService.rejectLowScore(req.params.id, threshold, reviewedBy);
      res.json({ success: true, message: `${count} items auto-rejected (score < ${threshold})` });
    } catch (error) {
      res.status(500).json({ error: 'Failed to auto-reject' });
    }
  });

  // === Approved Items (for downstream use) ===

  // GET /api/staging/approved/products
  router.get('/approved/products', async (req, res) => {
    try {
      const { sessionId } = req.query;
      const products = await stagingService.getApprovedProducts(sessionId as string | undefined);
      res.json({ products, count: products.length });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get approved products' });
    }
  });

  return router;
}
```

### 5.7 Staging Review UI

**File:** `public/staging.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DS1 - Research Staging</title>
    <link rel="stylesheet" href="/admin.css">
    <style>
        .staging-container { padding: 20px; max-width: 1400px; margin: 0 auto; }
        
        .session-card {
            background: #1c2128;
            border: 1px solid #30363d;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
        }
        
        .session-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        
        .session-stats {
            display: flex;
            gap: 16px;
        }
        
        .stat-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .stat-pending { background: #f0ad4e; color: #000; }
        .stat-approved { background: #28a745; color: #fff; }
        .stat-rejected { background: #dc3545; color: #fff; }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
        }
        
        .items-table th, .items-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #30363d;
        }
        
        .items-table th {
            background: #161b22;
            color: #8b949e;
            font-weight: 600;
        }
        
        .confidence-bar {
            width: 100px;
            height: 8px;
            background: #30363d;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .confidence-fill {
            height: 100%;
            border-radius: 4px;
        }
        
        .confidence-high { background: #28a745; }
        .confidence-medium { background: #f0ad4e; }
        .confidence-low { background: #dc3545; }
        
        .action-buttons {
            display: flex;
            gap: 8px;
        }
        
        .btn-approve { background: #28a745; }
        .btn-approve:hover { background: #218838; }
        .btn-reject { background: #dc3545; }
        .btn-reject:hover { background: #c82333; }
        .btn-info { background: #17a2b8; }
        .btn-info:hover { background: #138496; }
        
        .btn-sm {
            padding: 4px 8px;
            font-size: 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            color: white;
        }
        
        .source-badge {
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            background: #30363d;
        }
        
        .bulk-actions {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
            padding: 12px;
            background: #161b22;
            border-radius: 8px;
        }
        
        .filter-bar {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
        }
        
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #8b949e;
        }
        
        .trend-evidence {
            font-size: 12px;
            color: #8b949e;
            margin-top: 4px;
        }
        
        .pending-badge {
            position: fixed;
            top: 10px;
            right: 10px;
            background: #f0ad4e;
            color: #000;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <nav class="main-nav">
        <a href="/" class="nav-brand">DS1</a>
        <a href="/admin.html">Dashboard</a>
        <a href="/infra.html">Infrastructure</a>
        <a href="/analytics.html">Analytics</a>
        <a href="/staging.html" class="active">📋 Staging</a>
    </nav>

    <div class="pending-badge" id="pendingBadge" style="display: none;">
        📋 <span id="pendingCount">0</span> Pending Review
    </div>

    <div class="staging-container">
        <h1>🔬 Research Staging Area</h1>
        <p class="subtitle">Review and approve research results before they enter the product pipeline</p>

        <div class="filter-bar">
            <select id="sessionFilter" onchange="loadItems()">
                <option value="">All Sessions</option>
            </select>
            <select id="statusFilter" onchange="loadItems()">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="needs_info">Needs Info</option>
            </select>
            <button class="btn" onclick="refresh()">🔄 Refresh</button>
        </div>

        <div class="bulk-actions" id="bulkActions" style="display: none;">
            <span>Selected: <strong id="selectedCount">0</strong></span>
            <button class="btn btn-approve btn-sm" onclick="bulkApprove()">✓ Approve Selected</button>
            <button class="btn btn-reject btn-sm" onclick="bulkReject()">✗ Reject Selected</button>
            <button class="btn btn-sm" onclick="clearSelection()">Clear Selection</button>
        </div>

        <div id="sessionsContainer"></div>
    </div>

    <script>
        let sessions = [];
        let items = [];
        let selectedItems = new Set();

        async function loadSessions() {
            const res = await fetch('/api/staging/sessions');
            const data = await res.json();
            sessions = data.sessions;
            
            // Populate session filter
            const filter = document.getElementById('sessionFilter');
            filter.innerHTML = '<option value="">All Sessions</option>' + 
                sessions.map(s => `<option value="${s.id}">${s.category} (${s.id})</option>`).join('');
            
            renderSessions();
        }

        async function loadItems() {
            const sessionId = document.getElementById('sessionFilter').value;
            const status = document.getElementById('statusFilter').value;
            
            let url = '/api/staging/items?';
            if (sessionId) url += `sessionId=${sessionId}&`;
            if (status) url += `status=${status}`;
            
            const res = await fetch(url);
            const data = await res.json();
            items = data.items;
            
            renderItems();
            updatePendingBadge();
        }

        async function updatePendingBadge() {
            const res = await fetch('/api/staging/pending');
            const data = await res.json();
            
            const badge = document.getElementById('pendingBadge');
            const count = document.getElementById('pendingCount');
            
            if (data.pendingCount > 0) {
                badge.style.display = 'block';
                count.textContent = data.pendingCount;
            } else {
                badge.style.display = 'none';
            }
        }

        function renderSessions() {
            const container = document.getElementById('sessionsContainer');
            
            if (sessions.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <h3>No research sessions yet</h3>
                        <p>Run a product discovery to see results here</p>
                    </div>
                `;
                return;
            }
            
            // Show items table
            renderItems();
        }

        function renderItems() {
            const container = document.getElementById('sessionsContainer');
            
            if (items.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <h3>No items match your filters</h3>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = `
                <table class="items-table">
                    <thead>
                        <tr>
                            <th><input type="checkbox" onchange="toggleAll(this)" /></th>
                            <th>Product</th>
                            <th>Confidence</th>
                            <th>Source</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => renderItemRow(item)).join('')}
                    </tbody>
                </table>
            `;
        }

        function renderItemRow(item) {
            const confidenceClass = item.confidenceScore >= 70 ? 'high' : 
                                   item.confidenceScore >= 40 ? 'medium' : 'low';
            
            return `
                <tr data-id="${item.id}">
                    <td>
                        <input type="checkbox" 
                               ${item.status === 'pending' ? '' : 'disabled'} 
                               onchange="toggleItem(${item.id})" 
                               ${selectedItems.has(item.id) ? 'checked' : ''} />
                    </td>
                    <td>
                        <strong>${item.name}</strong>
                        <div class="trend-evidence">${item.trendEvidence || ''}</div>
                    </td>
                    <td>
                        <div class="confidence-bar">
                            <div class="confidence-fill confidence-${confidenceClass}" 
                                 style="width: ${item.confidenceScore}%"></div>
                        </div>
                        <span>${item.confidenceScore}%</span>
                    </td>
                    <td><span class="source-badge">${item.source}</span></td>
                    <td><span class="stat-badge stat-${item.status}">${item.status}</span></td>
                    <td class="action-buttons">
                        ${item.status === 'pending' ? `
                            <button class="btn-sm btn-approve" onclick="approve(${item.id})">✓</button>
                            <button class="btn-sm btn-reject" onclick="reject(${item.id})">✗</button>
                            <button class="btn-sm btn-info" onclick="needInfo(${item.id})">?</button>
                        ` : `
                            <span style="color: #8b949e; font-size: 12px;">
                                ${item.reviewedBy ? `by ${item.reviewedBy}` : ''}
                            </span>
                        `}
                    </td>
                </tr>
            `;
        }

        function toggleItem(id) {
            if (selectedItems.has(id)) {
                selectedItems.delete(id);
            } else {
                selectedItems.add(id);
            }
            updateBulkActions();
        }

        function toggleAll(checkbox) {
            if (checkbox.checked) {
                items.filter(i => i.status === 'pending').forEach(i => selectedItems.add(i.id));
            } else {
                selectedItems.clear();
            }
            renderItems();
            updateBulkActions();
        }

        function clearSelection() {
            selectedItems.clear();
            renderItems();
            updateBulkActions();
        }

        function updateBulkActions() {
            const bulkDiv = document.getElementById('bulkActions');
            const countSpan = document.getElementById('selectedCount');
            
            if (selectedItems.size > 0) {
                bulkDiv.style.display = 'flex';
                countSpan.textContent = selectedItems.size;
            } else {
                bulkDiv.style.display = 'none';
            }
        }

        async function approve(id) {
            await fetch(`/api/staging/items/${id}/approve`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewedBy: 'admin' })
            });
            loadItems();
        }

        async function reject(id) {
            const notes = prompt('Rejection reason (optional):');
            await fetch(`/api/staging/items/${id}/reject`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewedBy: 'admin', notes })
            });
            loadItems();
        }

        async function needInfo(id) {
            const notes = prompt('What additional info is needed?');
            if (!notes) return;
            await fetch(`/api/staging/items/${id}/need-info`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewedBy: 'admin', notes })
            });
            loadItems();
        }

        async function bulkApprove() {
            await fetch('/api/staging/bulk/approve', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemIds: Array.from(selectedItems), reviewedBy: 'admin' })
            });
            selectedItems.clear();
            loadItems();
        }

        async function bulkReject() {
            await fetch('/api/staging/bulk/reject', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemIds: Array.from(selectedItems), reviewedBy: 'admin' })
            });
            selectedItems.clear();
            loadItems();
        }

        function refresh() {
            loadSessions();
            loadItems();
        }

        // Initial load
        loadSessions();
        loadItems();
        
        // Auto-refresh every 30 seconds
        setInterval(updatePendingBadge, 30000);
    </script>
</body>
</html>
```

### 5.8 Configuration Options

Add to `AppConfig`:

```typescript
interface AppConfig {
  // ... existing ...
  
  // Staging options
  stagingEnabled: boolean;           // Enable/disable staging workflow
  stagingAutoApproveThreshold: number;  // Auto-approve items above this score (0-100, 0=disabled)
  stagingAutoRejectThreshold: number;   // Auto-reject items below this score (0-100, 0=disabled)
  stagingExpiryDays: number;         // Days before staged items expire
}
```

**Default values:**
```json
{
  "stagingEnabled": true,
  "stagingAutoApproveThreshold": 0,
  "stagingAutoRejectThreshold": 0,
  "stagingExpiryDays": 7
}
```

### 5.9 Integration with Existing Workflow

**Updated ProductResearchAgent to use staged/approved products:**

```typescript
class ProductResearchAgent {
  private stagingService: ResearchStagingService;
  
  async findWinningProducts(params: { category: string }): Promise<any> {
    const config = await this.configService.getConfig();
    
    if (config.trendsMode === 'live' && config.stagingEnabled) {
      // Live mode with staging - products go to staging area
      const stagingResult = await this.trendAdapter.findProducts(params.category);
      
      return {
        status: 'staged_for_review',
        sessionId: stagingResult[0]?.sessionId,
        itemCount: stagingResult[0]?.itemCount,
        message: 'Products have been staged for your review. Visit /staging.html to approve.',
        nextStep: 'Review and approve products in the staging area'
      };
    }
    
    if (config.trendsMode === 'live' && !config.stagingEnabled) {
      // Live mode without staging - direct return (legacy)
      return this.trendAdapter.findProducts(params.category);
    }
    
    // Mock mode
    return this.trendAdapter.findProducts(params.category);
  }
  
  // Get only approved products for downstream use
  async getApprovedProducts(sessionId?: string): Promise<any[]> {
    return this.stagingService.getApprovedProducts(sessionId);
  }
}
```

### 5.10 Timeline Updates

Add to Phase 1 timeline:

| Day | Task | Owner | Status |
|-----|------|-------|--------|
| 4-5 | Create staging database schema | Dev | ⬜ |
| 6 | Implement ResearchStagingService | Dev | ⬜ |
| 7 | Create staging API endpoints | Dev | ⬜ |
| 8 | Build staging review UI | Dev | ⬜ |
| 9 | Integrate staging with LiveTrendAdapter | Dev | ⬜ |
| 10 | Test end-to-end staging workflow | Dev | ⬜ |

---

## 6. Phase 2: Meta Ad Library Integration

### 6.1 Overview

**Goal:** Find proven winning products by analyzing competitor ads

**API:** Meta Ad Library API (free, requires developer account)

### 6.2 Setup Requirements

1. **Meta for Developers Account**
   - Go to: https://developers.facebook.com/
   - Create an app with "Marketing API" product

2. **Access Token**
   - Generate a User Access Token with `ads_read` permission
   - Or create a System User for long-lived tokens

3. **API Endpoints**
   - Base URL: `https://graph.facebook.com/v18.0/ads_archive`
   - Documentation: https://www.facebook.com/ads/library/api/

### 6.3 API Capabilities

| Parameter | Description | Use Case |
|-----------|-------------|----------|
| `search_terms` | Keywords in ad text | Find ads for "posture corrector" |
| `ad_reached_countries` | Geographic targeting | Filter to US/UK |
| `ad_active_status` | Active or inactive | Only show running ads |
| `ad_delivery_date_min` | Minimum start date | Find long-running (profitable) ads |
| `publisher_platforms` | FB, IG, Messenger, AN | Filter by platform |
| `media_type` | Image, video, meme | Filter by creative type |

### 6.4 Implementation Plan

#### 6.4.1 Update LiveCompetitorAdapter

**File:** `src/infra/research/LiveCompetitorAdapter.ts`

```typescript
import { CompetitorAnalysisPort } from '../../core/domain/ports/CompetitorAnalysisPort.js';

interface MetaAdLibraryConfig {
  accessToken: string;
  apiVersion: string;
}

export class LiveCompetitorAdapter implements CompetitorAnalysisPort {
  private config: MetaAdLibraryConfig;
  private baseUrl = 'https://graph.facebook.com';

  constructor() {
    this.config = {
      accessToken: process.env.META_ACCESS_TOKEN || '',
      apiVersion: 'v18.0'
    };

    if (!this.config.accessToken) {
      console.warn('[LiveCompetitorAdapter] META_ACCESS_TOKEN not set. Ad Library features disabled.');
    }
  }

  async analyzeCompetitors(category: string): Promise<any> {
    if (!this.config.accessToken) {
      return this.fallbackMockData(category);
    }

    // 1. Search for ads in this category
    const ads = await this.searchAdLibrary(category);

    // 2. Extract competitor pages
    const competitors = this.extractCompetitors(ads);

    // 3. Analyze ad longevity (longer = more profitable)
    const analysis = this.analyzeAdPerformance(ads);

    return {
      category,
      competitionLevel: this.calculateCompetitionLevel(ads.length),
      topCompetitors: competitors.slice(0, 10),
      adCount: ads.length,
      avgAdAge: analysis.avgAge,
      longestRunningAds: analysis.topAds,
      insights: this.generateInsights(ads)
    };
  }

  async getCompetitorAds(competitorUrl: string): Promise<any[]> {
    if (!this.config.accessToken) {
      return [];
    }

    // Extract page ID from URL
    const pageId = this.extractPageId(competitorUrl);
    
    // Search for ads from this specific page
    const ads = await this.getAdsByPage(pageId);
    
    return ads.map(ad => ({
      id: ad.id,
      pageName: ad.page_name,
      creative: {
        title: ad.ad_creative_bodies?.[0] || '',
        image: ad.ad_snapshot_url,
        cta: ad.ad_creative_link_captions?.[0] || ''
      },
      startDate: ad.ad_delivery_start_time,
      isActive: ad.ad_delivery_stop_time === null,
      daysRunning: this.calculateDaysRunning(ad.ad_delivery_start_time),
      platforms: ad.publisher_platforms
    }));
  }

  // --- API Methods ---

  private async searchAdLibrary(searchTerms: string): Promise<any[]> {
    const params = new URLSearchParams({
      access_token: this.config.accessToken,
      search_terms: searchTerms,
      ad_reached_countries: "['US']",
      ad_active_status: 'ACTIVE',
      ad_type: 'POLITICAL_AND_ISSUE_ADS', // Use 'ALL' for non-political
      fields: 'id,page_id,page_name,ad_creative_bodies,ad_creative_link_titles,ad_creative_link_captions,ad_snapshot_url,ad_delivery_start_time,ad_delivery_stop_time,publisher_platforms,estimated_audience_size',
      limit: '100'
    });

    const url = `${this.baseUrl}/${this.config.apiVersion}/ads_archive?${params}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error) {
        console.error('[LiveCompetitorAdapter] Meta API Error:', data.error);
        return [];
      }
      
      return data.data || [];
    } catch (error) {
      console.error('[LiveCompetitorAdapter] Request failed:', error);
      return [];
    }
  }

  private async getAdsByPage(pageId: string): Promise<any[]> {
    const params = new URLSearchParams({
      access_token: this.config.accessToken,
      search_page_ids: pageId,
      ad_reached_countries: "['US']",
      fields: 'id,page_name,ad_creative_bodies,ad_creative_link_titles,ad_snapshot_url,ad_delivery_start_time,ad_delivery_stop_time,publisher_platforms',
      limit: '50'
    });

    const url = `${this.baseUrl}/${this.config.apiVersion}/ads_archive?${params}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('[LiveCompetitorAdapter] Request failed:', error);
      return [];
    }
  }

  // --- Analysis Methods ---

  private extractCompetitors(ads: any[]): any[] {
    const pageMap = new Map<string, { id: string; name: string; adCount: number }>();
    
    for (const ad of ads) {
      const existing = pageMap.get(ad.page_id);
      if (existing) {
        existing.adCount++;
      } else {
        pageMap.set(ad.page_id, {
          id: ad.page_id,
          name: ad.page_name,
          adCount: 1
        });
      }
    }
    
    return Array.from(pageMap.values())
      .sort((a, b) => b.adCount - a.adCount);
  }

  private analyzeAdPerformance(ads: any[]): any {
    const now = Date.now();
    const ages = ads.map(ad => {
      const start = new Date(ad.ad_delivery_start_time).getTime();
      return (now - start) / (1000 * 60 * 60 * 24); // days
    });

    const avgAge = ages.length > 0 
      ? ages.reduce((a, b) => a + b, 0) / ages.length 
      : 0;

    const topAds = ads
      .map(ad => ({
        ...ad,
        daysRunning: this.calculateDaysRunning(ad.ad_delivery_start_time)
      }))
      .sort((a, b) => b.daysRunning - a.daysRunning)
      .slice(0, 5);

    return { avgAge, topAds };
  }

  private calculateDaysRunning(startDate: string): number {
    const start = new Date(startDate).getTime();
    const now = Date.now();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  }

  private calculateCompetitionLevel(adCount: number): string {
    if (adCount > 500) return 'Very High';
    if (adCount > 200) return 'High';
    if (adCount > 50) return 'Medium';
    return 'Low';
  }

  private generateInsights(ads: any[]): string[] {
    const insights: string[] = [];
    
    const longRunners = ads.filter(ad => this.calculateDaysRunning(ad.ad_delivery_start_time) > 30);
    if (longRunners.length > 0) {
      insights.push(`${longRunners.length} ads have been running >30 days (likely profitable)`);
    }

    const platforms = new Set(ads.flatMap(ad => ad.publisher_platforms || []));
    insights.push(`Competitors are advertising on: ${Array.from(platforms).join(', ')}`);

    return insights;
  }

  private extractPageId(url: string): string {
    // Extract page ID from Facebook URL
    const match = url.match(/facebook\.com\/(\d+)/);
    return match ? match[1] : url;
  }

  private fallbackMockData(category: string): any {
    return {
      category,
      competitionLevel: 'Unknown (API not configured)',
      topCompetitors: [],
      adCount: 0,
      avgAdAge: 0,
      longestRunningAds: [],
      insights: ['Configure META_ACCESS_TOKEN to enable competitor analysis']
    };
  }
}
```

### 6.5 Environment Variables

Add to `.env`:
```bash
META_ACCESS_TOKEN=your_long_lived_access_token
META_AD_ACCOUNT_ID=act_123456789  # Optional, for your own ads
```

### 6.6 Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Only shows ads with "Paid for by" disclosure | May miss some ads | Use AdSpy for comprehensive coverage |
| No spend/performance data | Can't see exact ROI | Use longevity as proxy (>30 days = profitable) |
| Rate limits | 200 requests/hour | Implement caching |
| Political ads focus | Different API for commercial | Use correct `ad_type` parameter |

---

## 7. Phase 3: TikTok Creative Center

### 7.1 Overview

**Goal:** Identify products going viral on TikTok before they saturate

**Challenge:** TikTok doesn't have a public API for trend data. Options:

1. **TikTok Creative Center** (manual) - Browse https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en
2. **TikTok Research API** - Requires academic/business approval (difficult)
3. **Third-party scrapers** - Use services like Apify or build custom scraper
4. **Social listening tools** - Brand24, Mention (paid)

### 7.2 Recommended Approach: Manual + AI

For MVP, implement a hybrid approach:

```typescript
interface TikTokTrendData {
  hashtags: string[];      // Manually curated or scraped
  sounds: string[];        // Trending sounds
  products: string[];      // Products appearing in viral videos
  lastUpdated: Date;
}

class TikTokTrendService {
  // Store trending data in a JSON file, updated manually or via scraper
  private trendFile = 'data/tiktok_trends.json';

  async getTrendingProducts(category: string): Promise<any[]> {
    const trends = await this.loadTrends();
    
    // Use AI to match category to trending content
    const matches = await this.matchCategoryToTrends(category, trends);
    
    return matches;
  }

  private async loadTrends(): Promise<TikTokTrendData> {
    // Load from file or fetch from API
    const fs = await import('fs/promises');
    const data = await fs.readFile(this.trendFile, 'utf-8');
    return JSON.parse(data);
  }
}
```

### 7.3 Future: Apify Scraper

If budget allows, use Apify's TikTok scrapers:
- **Cost:** ~$5/1000 results
- **Data:** Hashtags, views, engagement, video content
- **URL:** https://apify.com/clockworks/tiktok-scraper

---

## 8. Phase 4: Premium Data Sources

### 8.1 AdSpy Integration

**Cost:** $149/month
**Value:** Comprehensive ad database with filters

```typescript
interface AdSpyConfig {
  apiKey: string;
  baseUrl: string;
}

class AdSpyAdapter {
  async searchAds(params: {
    keywords: string;
    platform: 'facebook' | 'instagram' | 'native';
    minDaysOld?: number;
    sortBy?: 'likes' | 'comments' | 'shares' | 'date';
  }): Promise<any[]> {
    // AdSpy API implementation
  }
}
```

### 8.2 Exploding Topics Integration

**Cost:** $97/month
**Value:** Curated database of rising trends with growth projections

```typescript
class ExplodingTopicsAdapter {
  async getTrendingTopics(category: string): Promise<any[]> {
    // API returns topics with:
    // - Growth rate (%)
    // - Search volume
    // - Time to peak
    // - Related products
  }
}
```

### 8.3 Decision Matrix

| Use Case | Free Option | Paid Option |
|----------|-------------|-------------|
| Trend detection | Google Trends | Exploding Topics |
| Competitor ads | Meta Ad Library | AdSpy |
| TikTok trends | Manual curation | Apify scraper |
| Product validation | AI synthesis | Minea |

---

## 9. Configuration & Environment Variables

### 9.1 New Environment Variables

Add to `.env.example`:
```bash
# Research APIs
META_ACCESS_TOKEN=               # Meta Ad Library (free)
META_APP_ID=                     # Meta Developer App ID
ADSPY_API_KEY=                   # AdSpy (paid, optional)
EXPLODING_TOPICS_API_KEY=        # Exploding Topics (paid, optional)
APIFY_API_TOKEN=                 # Apify TikTok scraper (paid, optional)

# Research Configuration
RESEARCH_CACHE_TTL_HOURS=1       # How long to cache trend data
RESEARCH_FALLBACK_TO_AI=true    # Fall back to AI if APIs fail
```

### 9.2 Config Service Updates

Add to `AppConfig` interface:
```typescript
interface AppConfig {
  // ... existing fields ...
  
  // Research settings
  researchCacheTTL?: number;      // Cache duration in hours
  researchFallbackToAI?: boolean; // Fall back to AI on failure
  metaAdLibraryEnabled?: boolean; // Toggle Meta integration
  adSpyEnabled?: boolean;         // Toggle AdSpy integration
}
```

### 9.3 Config UI Updates

Add to Infrastructure page (`public/infra.html`):
```html
<tr class="config-row">
    <td><strong>Trend Analysis</strong></td>
    <td>
        <select id="trendsMode" name="trendsMode">
            <option value="mock">Mock (Static Data)</option>
            <option value="live">Live (Google Trends + AI)</option>
        </select>
    </td>
    <td>Source of product trend data.</td>
</tr>
<tr class="config-row">
    <td><strong>Competitor Analysis</strong></td>
    <td>
        <select id="researchMode" name="researchMode">
            <option value="mock">Mock (Static Data)</option>
            <option value="live">Live (Meta Ad Library)</option>
            <option value="premium">Premium (AdSpy)</option>
        </select>
    </td>
    <td>Source of competitor intelligence.</td>
</tr>
```

---

## 10. Error Handling & Fallbacks

### 10.1 Fallback Chain

```
Primary Source → Secondary Source → AI Fallback → Mock Data
     │                  │                │            │
     ▼                  ▼                ▼            ▼
Google Trends    (if rate limited)   OpenAI     Hardcoded
Meta Ad Library   retry after 1hr    Generate   Static JSON
```

### 10.2 Implementation

```typescript
class ResilientResearchService {
  private sources: ResearchSource[] = [
    new GoogleTrendsSource(),
    new MetaAdLibrarySource(),
    new AIFallbackSource(),
    new MockFallbackSource()
  ];

  async findProducts(category: string): Promise<any[]> {
    for (const source of this.sources) {
      try {
        if (await source.isAvailable()) {
          const result = await source.findProducts(category);
          if (result.length > 0) {
            return result;
          }
        }
      } catch (error) {
        console.warn(`[Research] ${source.name} failed:`, error);
        // Continue to next source
      }
    }
    
    throw new Error('All research sources failed');
  }
}
```

### 10.3 Circuit Breaker

Apply existing `LiveAiAdapter` circuit breaker pattern:
```typescript
class ResearchCircuitBreaker {
  private failures = 0;
  private threshold = 5;
  private resetTimeout = 60000; // 1 minute
  private lastFailure = 0;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open');
    }
    
    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private isOpen(): boolean {
    if (this.failures >= this.threshold) {
      if (Date.now() - this.lastFailure > this.resetTimeout) {
        this.reset();
        return false;
      }
      return true;
    }
    return false;
  }
}
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

**File:** `src/infra/trends/__tests__/LiveTrendAdapter.test.ts`

```typescript
describe('LiveTrendAdapter', () => {
  describe('analyzeTrend', () => {
    it('should return trend data for valid category', async () => {
      const adapter = new LiveTrendAdapter();
      const result = await adapter.analyzeTrend('fitness');
      
      expect(result).toHaveProperty('trendScore');
      expect(result.trendScore).toBeGreaterThanOrEqual(0);
      expect(result.trendScore).toBeLessThanOrEqual(100);
    });

    it('should fall back to AI on Google Trends failure', async () => {
      // Mock Google Trends to fail
      jest.spyOn(googleTrends, 'interestOverTime').mockRejectedValue(new Error('Rate limited'));
      
      const adapter = new LiveTrendAdapter();
      const result = await adapter.findProducts('fitness');
      
      // Should still return products via AI fallback
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
```

### 11.2 Integration Tests

```typescript
describe('Research Integration', () => {
  it('should complete full research flow', async () => {
    const agent = new ProductResearchAgent(mockDb, trendAdapter, competitorAdapter);
    
    const result = await agent.findWinningProducts({ category: 'Fitness' });
    
    expect(result.products).toBeDefined();
    expect(result.products.length).toBeGreaterThan(0);
    expect(result.products[0]).toHaveProperty('name');
    expect(result.products[0]).toHaveProperty('potential');
  });
});
```

### 11.3 Manual Testing Checklist

- [ ] Google Trends returns real data
- [ ] AI synthesizes products from trend data
- [ ] Fallback to AI-only works when Trends fails
- [ ] Meta Ad Library returns competitor ads
- [ ] Long-running ads are identified correctly
- [ ] Caching prevents excessive API calls
- [ ] Config toggles between mock/live modes
- [ ] All adapters handle errors gracefully

---

## 12. Cost Analysis

### 12.1 Free Tier (Phase 1-2)

| Service | Cost | Limitations |
|---------|------|-------------|
| Google Trends API | Free | Unofficial, may rate limit |
| Meta Ad Library | Free | Limited to disclosed ads |
| OpenAI (existing) | ~$10-50/mo | Already budgeted |

**Total:** $0 additional cost

### 12.2 Premium Tier (Phase 3-4)

| Service | Monthly Cost | Value |
|---------|--------------|-------|
| AdSpy | $149 | Comprehensive ad database |
| Exploding Topics | $97 | Curated trends |
| Apify (TikTok) | ~$20 | 4000 results/mo |
| **Total** | **$266/mo** | Full competitive intelligence |

### 12.3 ROI Calculation

Assuming 1 winning product found per month:
- Average profit per winner: $500-5000/mo
- Research tool cost: $266/mo
- **ROI: 2x-19x**

---

## 13. Timeline & Milestones

### Phase 1: Google Trends (Week 1-2)

| Day | Task | Owner | Status |
|-----|------|-------|--------|
| 1 | Install `google-trends-api` package | Dev | ⬜ |
| 2-3 | Implement `LiveTrendAdapter` with Trends | Dev | ⬜ |
| 4 | Add caching layer | Dev | ⬜ |
| 5 | Implement fallback to AI | Dev | ⬜ |
| 6-7 | Testing & bug fixes | Dev | ⬜ |
| 8 | Update config UI | Dev | ⬜ |
| 9-10 | Documentation & code review | Dev | ⬜ |

### Phase 2: Meta Ad Library (Week 3-4)

| Day | Task | Owner | Status |
|-----|------|-------|--------|
| 1 | Create Meta Developer account | Admin | ⬜ |
| 2 | Generate access token | Admin | ⬜ |
| 3-4 | Implement `LiveCompetitorAdapter` | Dev | ⬜ |
| 5 | Add competitor extraction | Dev | ⬜ |
| 6 | Implement ad longevity analysis | Dev | ⬜ |
| 7-8 | Testing & bug fixes | Dev | ⬜ |
| 9-10 | Integration with simulation | Dev | ⬜ |

### Phase 3: TikTok (Week 5-6)

| Day | Task | Owner | Status |
|-----|------|-------|--------|
| 1-2 | Evaluate Apify vs manual | Dev | ⬜ |
| 3-4 | Implement chosen solution | Dev | ⬜ |
| 5-6 | Integrate with product discovery | Dev | ⬜ |
| 7-8 | Testing | Dev | ⬜ |

### Phase 4: Premium APIs (Week 7-8, if budget approved)

| Day | Task | Owner | Status |
|-----|------|-------|--------|
| 1 | Sign up for AdSpy trial | Admin | ⬜ |
| 2-3 | Implement AdSpy adapter | Dev | ⬜ |
| 4 | Sign up for Exploding Topics | Admin | ⬜ |
| 5-6 | Implement ET adapter | Dev | ⬜ |
| 7-8 | A/B test free vs premium | Dev | ⬜ |

---

## 14. Risk Assessment

### 14.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Google Trends rate limiting | Medium | High | Caching, fallback to AI |
| Meta API changes | Low | Medium | Abstract behind port interface |
| AI hallucinations | Medium | Medium | Validate with real data |
| API keys leaked | Low | High | Use env vars, never commit |

### 14.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Trend data too generic | Medium | Medium | Combine multiple sources |
| Competitors using same tools | High | Low | Execution matters more than data |
| Premium tools not worth cost | Medium | Medium | Start with free, upgrade if needed |

### 14.3 Mitigation Matrix

```
High Impact ─────────────────────────────────────┐
     │                                            │
     │   API Key Leak      Rate Limiting         │
     │   [PREVENT]         [CACHE/FALLBACK]      │
     │                                            │
Med  │   AI Hallucinations                       │
     │   [VALIDATE]                               │
     │                                            │
Low  │                      API Changes          │
     │                      [ABSTRACT]            │
     └────────────────────────────────────────────┘
         Low              Medium              High
                      Probability
```

---

## 15. Success Metrics

### 15.1 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| API uptime | >99% | Monitor errors in logs |
| Response time | <5s | Measure adapter latency |
| Cache hit rate | >70% | Track cache hits/misses |
| Fallback rate | <10% | Track fallback invocations |

### 15.2 Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Product discovery accuracy | >50% winners | Track products that convert |
| Time to find winner | <1 week | From research to first sale |
| Competitor insights used | 100% | Track CEO decisions |
| Research cost per winner | <$50 | Total API cost / winners found |

### 15.3 Dashboard Updates

Add to Analytics page:
- Research source breakdown (mock vs live vs premium)
- Trend accuracy over time
- Competitor landscape visualization
- Product discovery funnel

---

## Appendix A: File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/infra/trends/LiveTrendAdapter.ts` | Modify | Add Google Trends integration + staging |
| `src/infra/research/LiveCompetitorAdapter.ts` | Modify | Add Meta Ad Library integration |
| `src/core/services/ResearchStagingService.ts` | **Create** | Staging area service for review workflow |
| `src/api/staging-routes.ts` | **Create** | API endpoints for staging management |
| `public/staging.html` | **Create** | Staging review dashboard UI |
| `src/infra/config/ConfigService.ts` | Modify | Add staging config options |
| `public/infra.html` | Modify | Add research mode toggles |
| `.env.example` | Modify | Add new environment variables |
| `package.json` | Modify | Add `google-trends-api` + `uuid` dependencies |
| `src/infra/trends/TikTokTrendService.ts` | Create | New TikTok integration (Phase 3) |
| `src/infra/research/AdSpyAdapter.ts` | Create | New AdSpy integration (Phase 4) |

### Database Migrations

| Migration | Description |
|-----------|-------------|
| `create_research_staging.sql` | Creates `research_staging` table for pending items |
| `create_research_sessions.sql` | Creates `research_sessions` table for grouping |

---

## Appendix B: Quick Reference

### Environment Variables
```bash
# Required for Phase 1
# (None - Google Trends is unauthenticated)

# Required for Phase 2
META_ACCESS_TOKEN=your_token_here

# Optional - Phase 4
ADSPY_API_KEY=
EXPLODING_TOPICS_API_KEY=
APIFY_API_TOKEN=

# Staging Configuration
STAGING_ENABLED=true
STAGING_AUTO_APPROVE_THRESHOLD=0    # 0 = disabled, 70+ = auto-approve high confidence
STAGING_AUTO_REJECT_THRESHOLD=0     # 0 = disabled, <40 = auto-reject low confidence
STAGING_EXPIRY_DAYS=7
```

### Config Modes
```json
{
  "trendsMode": "mock | live",
  "researchMode": "mock | live | premium",
  "stagingEnabled": true,
  "stagingAutoApproveThreshold": 0,
  "stagingAutoRejectThreshold": 0,
  "stagingExpiryDays": 7
}
```

### Staging API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/staging/sessions` | GET | List all research sessions |
| `/api/staging/sessions/:id` | GET | Get session with items |
| `/api/staging/items` | GET | Get all staged items (filter by session/status) |
| `/api/staging/pending` | GET | Get pending item count |
| `/api/staging/items/:id/approve` | POST | Approve an item |
| `/api/staging/items/:id/reject` | POST | Reject an item |
| `/api/staging/bulk/approve` | POST | Bulk approve items |
| `/api/staging/bulk/reject` | POST | Bulk reject items |
| `/api/staging/sessions/:id/auto-approve` | POST | Auto-approve high-score items |
| `/api/staging/approved/products` | GET | Get approved products for use |

### API Endpoints Used
- Google Trends: `google-trends-api` npm package (unofficial)
- Meta Ad Library: `https://graph.facebook.com/v18.0/ads_archive`
- AdSpy: `https://api.adspy.com/v1/search`
- TikTok: Apify actor or manual

---

*Document Version: 1.1*
*Created: December 2024*
*Last Updated: December 2024*
*Author: DS1 Development Team*

## Change Log
| Date | Author | Change Description |
| :--- | :--- | :--- |
| 2025-12-21 | GitHub Copilot | Standardized format per PMO Maintenance Plan. |
