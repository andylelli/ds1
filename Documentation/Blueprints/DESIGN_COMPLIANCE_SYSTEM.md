# 🧠 Deep Think: Compliance & Risk Management

**Status:** Draft
**Date:** December 2025
**Objective:** Prevent the agents from engaging in illegal, unethical, or platform-banning behaviors.

## 1. The Problem
AI Agents are naive. Without guardrails, they might:
*   Sell counterfeit goods (e.g., "Nike" shoes from AliExpress).
*   Use copyrighted music in TikTok ads.
*   Make false health claims (e.g., "Cures Cancer").
*   Violate GDPR/CCPA by mishandling customer data.

**Consequence:** Stripe Ban, Facebook Ad Account Ban, or Lawsuits.

## 2. The Solution: The Compliance Officer Agent

We introduce a specialized agent (or a middleware layer) that acts as the **Internal Auditor**.

### 2.1 The "Pre-Flight" Check

Before *any* public action (publishing an ad, listing a product, sending an email), the content must pass a **Compliance Check**.

#### Check A: Trademark Scanning (Product Research)
*   **Trigger:** `ProductResearcher` finds a new product.
*   **Action:** Check Product Name & Description against a "Blacklist" and USPTO API.
*   **Rules:**
    *   No big brand names (Nike, Apple, Disney).
    *   No "Lookalikes" (e.g., "Pikachu-style plush").

#### Check B: Ad Policy Scanning (Marketing)
*   **Trigger:** `MarketingAgent` generates ad copy/image.
*   **Action:** Analyze text for prohibited keywords.
*   **Rules:**
    *   No "Before/After" weight loss claims (Meta Policy).
    *   No profanity or adult content.
    *   No false urgency ("Going out of business" when not true).

#### Check C: Data Privacy (Operations)
*   **Trigger:** `RetentionAgent` exports a list.
*   **Action:** Ensure PII (Personally Identifiable Information) is handled correctly.
*   **Rules:**
    *   Honor "Unsubscribe" requests immediately.

### 2.2 Implementation: The `ComplianceGuard` Class

We don't necessarily need a full "Agent" for this. A library of validators is faster.

```javascript
class ComplianceGuard {
  static async validateProduct(product) {
    const riskScore = await checkTrademarks(product.name);
    if (riskScore > 0.8) throw new Error("Trademark Violation Detected");
    return true;
  }

  static async validateAdCopy(text) {
    const policyViolations = await checkMetaPolicy(text);
    if (policyViolations.length > 0) throw new Error("Ad Policy Violation");
    return true;
  }
}
```

## 3. Implementation Plan

### Phase 1: Keyword Blacklists
Create `src/config/compliance_blacklist.json`.
*   Brands: `["nike", "adidas", "lego", ...]`
*   Banned Words: `["cure", "guaranteed weight loss", "free money", ...]`

### Phase 2: The Middleware
Wrap the `MarketingAgent.createAd()` tool with a decorator that runs `ComplianceGuard.validateAdCopy()`.

### Phase 3: Visual Inspection (Future)
Use OpenAI Vision API to check generated images for:
*   Nudity/Violence.
*   Text overlay issues (Meta's 20% text rule).
*   Copyrighted logos.
