# 🔬 Live Research Integration Plan

## Executive Summary

This document outlines the complete plan for integrating live research endpoints into the DS1 dropshipping system. The goal is to replace mock data with real market intelligence for product discovery, trend analysis, and competitor research.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Target Architecture](#2-target-architecture)
3. [Integration Priorities](#3-integration-priorities)
4. [Phase 1: Google Trends Integration](#4-phase-1-google-trends-integration)
5. [Phase 2: Meta Ad Library Integration](#5-phase-2-meta-ad-library-integration)
6. [Phase 3: TikTok Creative Center](#6-phase-3-tiktok-creative-center)
7. [Phase 4: Premium Data Sources](#7-phase-4-premium-data-sources)
8. [Configuration & Environment Variables](#8-configuration--environment-variables)
9. [Error Handling & Fallbacks](#9-error-handling--fallbacks)
10. [Testing Strategy](#10-testing-strategy)
11. [Cost Analysis](#11-cost-analysis)
12. [Timeline & Milestones](#12-timeline--milestones)
13. [Risk Assessment](#13-risk-assessment)
14. [Success Metrics](#14-success-metrics)

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

## 5. Phase 2: Meta Ad Library Integration

### 5.1 Overview

**Goal:** Find proven winning products by analyzing competitor ads

**API:** Meta Ad Library API (free, requires developer account)

### 5.2 Setup Requirements

1. **Meta for Developers Account**
   - Go to: https://developers.facebook.com/
   - Create an app with "Marketing API" product

2. **Access Token**
   - Generate a User Access Token with `ads_read` permission
   - Or create a System User for long-lived tokens

3. **API Endpoints**
   - Base URL: `https://graph.facebook.com/v18.0/ads_archive`
   - Documentation: https://www.facebook.com/ads/library/api/

### 5.3 API Capabilities

| Parameter | Description | Use Case |
|-----------|-------------|----------|
| `search_terms` | Keywords in ad text | Find ads for "posture corrector" |
| `ad_reached_countries` | Geographic targeting | Filter to US/UK |
| `ad_active_status` | Active or inactive | Only show running ads |
| `ad_delivery_date_min` | Minimum start date | Find long-running (profitable) ads |
| `publisher_platforms` | FB, IG, Messenger, AN | Filter by platform |
| `media_type` | Image, video, meme | Filter by creative type |

### 5.4 Implementation Plan

#### 5.4.1 Update LiveCompetitorAdapter

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

### 5.5 Environment Variables

Add to `.env`:
```bash
META_ACCESS_TOKEN=your_long_lived_access_token
META_AD_ACCOUNT_ID=act_123456789  # Optional, for your own ads
```

### 5.6 Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Only shows ads with "Paid for by" disclosure | May miss some ads | Use AdSpy for comprehensive coverage |
| No spend/performance data | Can't see exact ROI | Use longevity as proxy (>30 days = profitable) |
| Rate limits | 200 requests/hour | Implement caching |
| Political ads focus | Different API for commercial | Use correct `ad_type` parameter |

---

## 6. Phase 3: TikTok Creative Center

### 6.1 Overview

**Goal:** Identify products going viral on TikTok before they saturate

**Challenge:** TikTok doesn't have a public API for trend data. Options:

1. **TikTok Creative Center** (manual) - Browse https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en
2. **TikTok Research API** - Requires academic/business approval (difficult)
3. **Third-party scrapers** - Use services like Apify or build custom scraper
4. **Social listening tools** - Brand24, Mention (paid)

### 6.2 Recommended Approach: Manual + AI

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

### 6.3 Future: Apify Scraper

If budget allows, use Apify's TikTok scrapers:
- **Cost:** ~$5/1000 results
- **Data:** Hashtags, views, engagement, video content
- **URL:** https://apify.com/clockworks/tiktok-scraper

---

## 7. Phase 4: Premium Data Sources

### 7.1 AdSpy Integration

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

### 7.2 Exploding Topics Integration

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

### 7.3 Decision Matrix

| Use Case | Free Option | Paid Option |
|----------|-------------|-------------|
| Trend detection | Google Trends | Exploding Topics |
| Competitor ads | Meta Ad Library | AdSpy |
| TikTok trends | Manual curation | Apify scraper |
| Product validation | AI synthesis | Minea |

---

## 8. Configuration & Environment Variables

### 8.1 New Environment Variables

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

### 8.2 Config Service Updates

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

### 8.3 Config UI Updates

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

## 9. Error Handling & Fallbacks

### 9.1 Fallback Chain

```
Primary Source → Secondary Source → AI Fallback → Mock Data
     │                  │                │            │
     ▼                  ▼                ▼            ▼
Google Trends    (if rate limited)   OpenAI     Hardcoded
Meta Ad Library   retry after 1hr    Generate   Static JSON
```

### 9.2 Implementation

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

### 9.3 Circuit Breaker

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

## 10. Testing Strategy

### 10.1 Unit Tests

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

### 10.2 Integration Tests

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

### 10.3 Manual Testing Checklist

- [ ] Google Trends returns real data
- [ ] AI synthesizes products from trend data
- [ ] Fallback to AI-only works when Trends fails
- [ ] Meta Ad Library returns competitor ads
- [ ] Long-running ads are identified correctly
- [ ] Caching prevents excessive API calls
- [ ] Config toggles between mock/live modes
- [ ] All adapters handle errors gracefully

---

## 11. Cost Analysis

### 11.1 Free Tier (Phase 1-2)

| Service | Cost | Limitations |
|---------|------|-------------|
| Google Trends API | Free | Unofficial, may rate limit |
| Meta Ad Library | Free | Limited to disclosed ads |
| OpenAI (existing) | ~$10-50/mo | Already budgeted |

**Total:** $0 additional cost

### 11.2 Premium Tier (Phase 3-4)

| Service | Monthly Cost | Value |
|---------|--------------|-------|
| AdSpy | $149 | Comprehensive ad database |
| Exploding Topics | $97 | Curated trends |
| Apify (TikTok) | ~$20 | 4000 results/mo |
| **Total** | **$266/mo** | Full competitive intelligence |

### 11.3 ROI Calculation

Assuming 1 winning product found per month:
- Average profit per winner: $500-5000/mo
- Research tool cost: $266/mo
- **ROI: 2x-19x**

---

## 12. Timeline & Milestones

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

## 13. Risk Assessment

### 13.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Google Trends rate limiting | Medium | High | Caching, fallback to AI |
| Meta API changes | Low | Medium | Abstract behind port interface |
| AI hallucinations | Medium | Medium | Validate with real data |
| API keys leaked | Low | High | Use env vars, never commit |

### 13.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Trend data too generic | Medium | Medium | Combine multiple sources |
| Competitors using same tools | High | Low | Execution matters more than data |
| Premium tools not worth cost | Medium | Medium | Start with free, upgrade if needed |

### 13.3 Mitigation Matrix

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

## 14. Success Metrics

### 14.1 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| API uptime | >99% | Monitor errors in logs |
| Response time | <5s | Measure adapter latency |
| Cache hit rate | >70% | Track cache hits/misses |
| Fallback rate | <10% | Track fallback invocations |

### 14.2 Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Product discovery accuracy | >50% winners | Track products that convert |
| Time to find winner | <1 week | From research to first sale |
| Competitor insights used | 100% | Track CEO decisions |
| Research cost per winner | <$50 | Total API cost / winners found |

### 14.3 Dashboard Updates

Add to Analytics page:
- Research source breakdown (mock vs live vs premium)
- Trend accuracy over time
- Competitor landscape visualization
- Product discovery funnel

---

## Appendix A: File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/infra/trends/LiveTrendAdapter.ts` | Modify | Add Google Trends integration |
| `src/infra/research/LiveCompetitorAdapter.ts` | Modify | Add Meta Ad Library integration |
| `src/infra/config/ConfigService.ts` | Modify | Add new config options |
| `public/infra.html` | Modify | Add research mode toggles |
| `.env.example` | Modify | Add new environment variables |
| `package.json` | Modify | Add `google-trends-api` dependency |
| `src/infra/trends/TikTokTrendService.ts` | Create | New TikTok integration (Phase 3) |
| `src/infra/research/AdSpyAdapter.ts` | Create | New AdSpy integration (Phase 4) |

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
```

### Config Modes
```json
{
  "trendsMode": "mock | live",
  "researchMode": "mock | live | premium"
}
```

### API Endpoints Used
- Google Trends: `google-trends-api` npm package (unofficial)
- Meta Ad Library: `https://graph.facebook.com/v18.0/ads_archive`
- AdSpy: `https://api.adspy.com/v1/search`
- TikTok: Apify actor or manual

---

*Document Version: 1.0*
*Created: December 2024*
*Last Updated: December 2024*
*Author: DS1 Development Team*
