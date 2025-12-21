# 🔌 External Endpoints Reference

This document catalogs all external third-party APIs and services that the DS1 system needs to integrate with for full production operation.

---

## Quick Reference Table

| Category | Agent(s) | Port Interface | Live Candidates | Status |
|----------|----------|----------------|-----------------|--------|
| AI/LLM | All Agents | `AiPort` | OpenAI, Azure OpenAI | ✅ Implemented |
| E-Commerce | Store Build Agent | `ShopPlatformPort` | Shopify | ✅ Implemented |
| Advertising | Marketing Agent | `AdsPlatformPort` | Meta, TikTok, Google, Pinterest | 🔶 Partial |
| Trends | Product Research Agent | `TrendAnalysisPort` | Google Trends, TikTok Creative Center | 🔶 Partial |
| Competitor Intel | Product Research Agent | `CompetitorAnalysisPort` | Meta Ad Library, AdSpy, BigSpy | ❌ Mock Only |
| Fulfilment | Supplier Agent, Operations Agent | `FulfilmentPort` | AliExpress, CJ Dropshipping, AutoDS | ❌ Mock Only |
| Email/Helpdesk | Customer Service Agent | `EmailPort` | SendGrid, Mailgun, Gorgias, Zendesk | ❌ Mock Only |
| Payments | Operations Agent | - | Stripe, PayPal | ❌ Not Started |
| Shipping | Operations Agent | - | ShipStation, EasyPost, AfterShip | ❌ Not Started |
| Tax/Compliance | Operations Agent | - | TaxJar, Avalara | ❌ Not Started |

---

## 1. AI / LLM Services

### Purpose
Powers all agent decision-making, text generation, and intelligent responses.

### Agents Using This
- **CEO Agent** - Strategic decisions, approvals
- **Product Research Agent** - Product ideation, trend analysis
- **Store Build Agent** - Product descriptions, SEO content
- **Marketing Agent** - Ad copy, creative generation
- **Customer Service Agent** - Response drafting, sentiment analysis

### Port Interface
```typescript
interface AiPort {
    chat(systemPrompt: string, userMessage: string, tools?: ToolDefinition[]): Promise<AiResponse>;
}
```

### Candidate Providers

| Provider | Pricing | Pros | Cons |
|----------|---------|------|------|
| **OpenAI** | $0.002-0.06/1K tokens | Best quality, GPT-4o | Rate limits, cost |
| **Azure OpenAI** | Same as OpenAI | Enterprise compliance, SLA | Longer setup |
| **Anthropic Claude** | $0.003-0.015/1K tokens | Great reasoning | Smaller ecosystem |
| **Google Gemini** | Free tier available | Cost effective | Quality varies |

### Current Implementation
- **Adapter**: `LiveAiAdapter` → `OpenAIService`
- **Config Key**: `openaiEnabled`
- **Env Vars**: `OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`

---

## 2. E-Commerce Platform (Shopify)

### Purpose
Create and manage the online store - products, collections, checkout, orders.

### Agents Using This
- **Store Build Agent** - Create product pages, manage inventory
- **Operations Agent** - Read orders, update fulfillment status

### Port Interface
```typescript
interface ShopPlatformPort {
  createProduct(product: Omit<Product, 'id'>): Promise<Product>;
  listProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
}
```

### Candidate Providers

| Provider | Pricing | Pros | Cons |
|----------|---------|------|------|
| **Shopify** | $39-399/mo | Industry standard, great API | Monthly fees |
| **WooCommerce** | Free (hosting costs) | Open source, flexible | Self-hosted complexity |
| **BigCommerce** | $39-299/mo | Good API | Smaller ecosystem |

### Current Implementation
- **Adapter**: `LiveShopAdapter` → `ShopifyService`
- **Config Key**: `shopMode`
- **Env Vars**: `SHOPIFY_SHOP_NAME`, `SHOPIFY_ACCESS_TOKEN`, `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`

### Required API Scopes
- `read_products`, `write_products`
- `read_orders`, `write_orders`
- `read_inventory`, `write_inventory`
- `write_themes` (for customization)

---

## 3. Advertising Platforms

### Purpose
Create, manage, and optimize paid advertising campaigns across social media.

### Agents Using This
- **Marketing Agent** - Launch campaigns, adjust budgets, kill underperformers

### Port Interface
```typescript
interface AdsPlatformPort {
  createCampaign(campaign: Omit<Campaign, 'id'>): Promise<Campaign>;
  listCampaigns(): Promise<Campaign[]>;
  stopCampaign(id: string): Promise<void>;
}
```

### Candidate Providers

| Platform | API | Setup Complexity | Notes |
|----------|-----|------------------|-------|
| **Meta (Facebook/Instagram)** | Marketing API | High | Requires Business Manager, System User token |
| **TikTok** | TikTok Ads API | Medium | Fast-growing, younger demographic |
| **Google Ads** | Google Ads API | High | High-intent search traffic |
| **Pinterest** | Pinterest Ads API | Low | Good for visual products |
| **Snapchat** | Snap Marketing API | Low | Younger demographic |

### Meta Ads Integration Details
1. Create **Meta Business Manager** account
2. Create a **System User** with `ads_management` permission
3. Generate long-lived access token
4. Env vars needed:
   - `META_ACCESS_TOKEN`
   - `META_AD_ACCOUNT_ID`
   - `META_APP_ID`

### TikTok Ads Integration Details
1. Create **TikTok for Business** account
2. Apply for **Marketing API** access
3. Env vars needed:
   - `TIKTOK_ACCESS_TOKEN`
   - `TIKTOK_ADVERTISER_ID`

### Current Implementation
- **Adapter**: `LiveAdsAdapter` (partial)
- **Config Key**: `adsMode`
- **Status**: Mock only - needs full implementation

---

## 4. Trend Analysis

### Purpose
Identify trending products and niches before they become saturated.

### Agents Using This
- **Product Research Agent** - Find winning products, check market saturation

### Port Interface
```typescript
interface TrendAnalysisPort {
  analyzeTrend(category: string): Promise<any>;
  checkSaturation(productName: string): Promise<any>;
  findProducts(category: string): Promise<any[]>;
}
```

### Candidate Providers

| Provider | Type | Pricing | Notes |
|----------|------|---------|-------|
| **Google Trends** | Official-ish | Free | Use `google-trends-api` npm package |
| **TikTok Creative Center** | Official | Free | Trending hashtags and sounds |
| **Exploding Topics** | SaaS | $97-397/mo | Curated trend database |
| **Glimpse** | Chrome Extension + API | $50/mo | Google Trends enhanced |
| **SerpApi** | SERP Scraping | $50+/mo | Reliable Google data |

### Current Implementation
- **Adapter**: `LiveTrendAdapter` (uses AI to simulate trends)
- **Config Key**: `trendsMode`
- **Status**: Partially implemented (AI-based, not real trend data)

---

## 5. Competitor Intelligence

### Purpose
Spy on competitor ads to find proven winners and creative inspiration.

### Agents Using This
- **Product Research Agent** - Find competitor ads, analyze what's working

### Port Interface
```typescript
interface CompetitorAnalysisPort {
  analyzeCompetitors(category: string): Promise<any>;
  getCompetitorAds(competitorUrl: string): Promise<any[]>;
}
```

### Candidate Providers

| Provider | Pricing | Coverage | Notes |
|----------|---------|----------|-------|
| **Meta Ad Library** | Free | Facebook/Instagram only | Official, limited data |
| **AdSpy** | $149/mo | FB, IG, native | Industry standard |
| **BigSpy** | $9-99/mo | FB, IG, TikTok, Pinterest | Budget option |
| **Minea** | $49-99/mo | All platforms + influencers | Good for dropshipping |
| **PiPiADS** | $77-263/mo | TikTok focused | Best for TikTok |

### Meta Ad Library API
1. Register on **Meta for Developers**
2. Get Marketing API access token
3. Use the Ad Library API endpoint to search ads by keyword
4. Env vars:
   - `META_ACCESS_TOKEN`

### Current Implementation
- **Adapter**: `LiveCompetitorAdapter` (stub only)
- **Config Key**: `researchMode`
- **Status**: Mock only - needs implementation

---

## 6. Fulfilment / Supplier APIs

### Purpose
Find suppliers, negotiate prices, and place orders with dropshipping suppliers.

### Agents Using This
- **Supplier Agent** - Find and vet suppliers, negotiate MOQ/pricing
- **Operations Agent** - Place orders, track shipments

### Port Interface
```typescript
interface FulfilmentPort {
  findSuppliers(productId: string): Promise<any>;
  negotiatePrice(supplierId: string, targetPrice: number): Promise<any>;
  placeOrder(order: any): Promise<any>;
}
```

### Candidate Providers

| Provider | Type | Pricing | Notes |
|----------|------|---------|-------|
| **AliExpress Affiliate API** | Affiliate | Free | Limited to product search |
| **CJ Dropshipping API** | Full | Free | Full automation possible |
| **AutoDS** | SaaS | $26-208/mo | All-in-one automation |
| **Spocket** | SaaS | $39-299/mo | US/EU suppliers |
| **Zendrop** | SaaS | $49-79/mo | Fast shipping focus |
| **DSers** | SaaS | Free-499/mo | AliExpress focused |

### CJ Dropshipping Integration
1. Create **CJ Dropshipping** account
2. Apply for API access
3. Endpoints:
   - `POST /product/search` - Find products
   - `POST /order/create` - Place orders
   - `GET /order/track` - Track shipments
4. Env vars:
   - `CJ_API_KEY`

### Current Implementation
- **Adapter**: `LiveFulfilmentAdapter` (stub only)
- **Config Key**: `fulfilmentMode`
- **Status**: Mock only - throws "Not implemented"

---

## 7. Email / Helpdesk

### Purpose
Send transactional emails, marketing emails, and manage customer support tickets.

### Agents Using This
- **Customer Service Agent** - Respond to inquiries, handle complaints
- **Marketing Agent** - Send promotional emails, abandoned cart sequences

### Port Interface
```typescript
interface EmailPort {
  sendEmail(to: string, subject: string, body: string): Promise<boolean>;
  receiveEmails(filter?: any): Promise<any[]>;
}
```

### Candidate Providers

| Provider | Type | Pricing | Notes |
|----------|---------|---------|-------|
| **SendGrid** | Transactional | Free-$89/mo | Reliable, good API |
| **Mailgun** | Transactional | $0/1000 emails | Developer friendly |
| **Klaviyo** | Marketing | $20-1000+/mo | E-commerce focused |
| **Gorgias** | Helpdesk | $10-900/mo | Shopify integration |
| **Zendesk** | Helpdesk | $19-115/user/mo | Enterprise ready |
| **Intercom** | Helpdesk + Chat | $39-139/mo | Good for chat |

### SendGrid Integration
1. Create **SendGrid** account
2. Generate API key with "Mail Send" permission
3. Verify sender domain
4. Env vars:
   - `SENDGRID_API_KEY`
   - `SENDGRID_FROM_EMAIL`

### Current Implementation
- **Adapter**: `LiveEmailAdapter` (stub only)
- **Config Key**: `emailMode`
- **Status**: Mock only - needs implementation

---

## 8. Payments (Future)

### Purpose
Process payments, handle disputes, manage refunds.

### Agents Using This
- **Operations Agent** - Verify payments, issue refunds, fight chargebacks

### Candidate Providers

| Provider | Pricing | Notes |
|----------|---------|-------|
| **Stripe** | 2.9% + $0.30 | Industry standard, great API |
| **PayPal** | 2.9% + $0.30 | Customer trust, buyer protection |
| **Shopify Payments** | 2.4-2.9% | Integrated with Shopify |

### Key Webhooks to Handle
- `charge.succeeded` - Payment confirmed
- `charge.dispute.created` - Chargeback filed
- `charge.refunded` - Refund issued

### Current Implementation
- **Status**: Not started - handled by Shopify Payments

---

## 9. Shipping / Logistics (Future)

### Purpose
Get shipping rates, generate labels, track packages.

### Agents Using This
- **Operations Agent** - Calculate shipping costs, track orders

### Candidate Providers

| Provider | Type | Pricing |
|----------|------|---------|
| **ShipStation** | Multi-carrier | $9-159/mo |
| **EasyPost** | API | Pay per label |
| **AfterShip** | Tracking | Free-199/mo |
| **Shippo** | API | Free + per label |

### Current Implementation
- **Status**: Not started

---

## 10. Tax / Compliance (Future)

### Purpose
Calculate and file sales tax automatically.

### Agents Using This
- **Operations Agent** - Calculate tax at checkout
- **Analytics Agent** - Generate tax reports

### Candidate Providers

| Provider | Pricing | Notes |
|----------|---------|-------|
| **TaxJar** | $19-99/mo | Shopify integration |
| **Avalara** | Custom | Enterprise scale |

### Current Implementation
- **Status**: Not started

---

## Environment Variables Checklist

```bash
# AI
OPENAI_API_KEY=sk-...
AZURE_OPENAI_ENDPOINT=https://...  # Optional

# Shopify
SHOPIFY_SHOP_NAME=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_...
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...

# Meta Ads (Facebook/Instagram)
META_ACCESS_TOKEN=...
META_AD_ACCOUNT_ID=act_...
META_APP_ID=...

# TikTok Ads
TIKTOK_ACCESS_TOKEN=...
TIKTOK_ADVERTISER_ID=...

# Google Ads
GOOGLE_ADS_DEVELOPER_TOKEN=...
GOOGLE_ADS_CLIENT_ID=...
GOOGLE_ADS_CLIENT_SECRET=...
GOOGLE_ADS_REFRESH_TOKEN=...

# Fulfilment
CJ_API_KEY=...

# Email
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=...

# Payments
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database
DATABASE_URL=postgresql://...
SIMULATOR_DATABASE_URL=postgresql://...
```

---

## Implementation Priority

### Phase 1 (MVP) ✅
1. OpenAI API - Core agent intelligence
2. Shopify API - Store operations
3. PostgreSQL - Data persistence

### Phase 2 (Marketing)
4. Meta Marketing API - Launch ads
5. Google Trends - Find products
6. Meta Ad Library - Competitor research

### Phase 3 (Operations)
7. SendGrid - Customer emails
8. CJ Dropshipping - Order fulfillment
9. AfterShip - Package tracking

### Phase 4 (Scale)
10. TikTok Ads API - Expand reach
11. Stripe - Payment disputes
12. TaxJar - Tax compliance

---

## Change Log
| Date | Author | Change Description |
| :--- | :--- | :--- |
| 2025-12-21 | GitHub Copilot | Standardized format per PMO Maintenance Plan. |
