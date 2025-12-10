# 🧠 Deep Think: Retention & LTV System

**Status:** Draft
**Date:** December 2025
**Objective:** Implement a Retention Agent to increase Customer Lifetime Value (LTV) via Email/SMS.

## 1. The Problem
Currently, we are a "Churn and Burn" business.
*   We pay for a customer (CAC).
*   They buy once.
*   We never talk to them again.
*   **Result:** Low Profit Margins.

## 2. The Solution: Automated Flows (Klaviyo Style)

We need a `RetentionAgent` that manages **Email & SMS Flows**.

### 2.1 The Flows

#### Flow A: Abandoned Cart (High Priority)
*   **Trigger:** `CHECKOUT_STARTED` but no `ORDER_PAID` within 1 hour.
*   **Action 1 (1 hr):** "You left something behind!" (Email).
*   **Action 2 (12 hrs):** "Here is 10% off: SAVE10" (Email).
*   **Action 3 (24 hrs):** "Last chance!" (SMS).

#### Flow B: Post-Purchase (Welcome)
*   **Trigger:** `ORDER_PAID`.
*   **Action 1 (Immediate):** Order Confirmation + "Thank You".
*   **Action 2 (3 days):** "How is your experience?" (Survey).
*   **Action 3 (7 days):** "You might also like..." (Cross-sell).

#### Flow C: Win-Back
*   **Trigger:** Customer hasn't bought in 60 days.
*   **Action:** "We miss you! Come back for 20% off."

### 2.2 The Retention Agent

The `RetentionAgent` is not just a script; it's a **Copywriter**.

**Responsibilities:**
1.  **Drafting:** It writes the email subject lines and body copy using OpenAI.
2.  **Scheduling:** It decides *when* to send (e.g., "Don't send at 3 AM").
3.  **Optimization:** It A/B tests subject lines.
    *   *Variant A:* "Your cart is waiting..."
    *   *Variant B:* "Don't miss out on your Galaxy Projector!"
    *   *Result:* Agent checks Open Rate and picks the winner.

### 2.3 Data Requirements

We need to track **Customer Profiles** in the DB.

```json
{
  "id": "cust_555",
  "email": "bob@example.com",
  "phone": "+15550001234",
  "marketingConsent": true,
  "stats": {
    "totalSpent": 150.00,
    "orderCount": 2,
    "lastOrderDate": "2025-11-01"
  },
  "tags": ["vip", "dog_lover"]
}
```

## 3. Implementation Plan

### Phase 1: The Simulator
1.  Create `src/agents/retentionAgent.js`.
2.  Implement `sendEmail(to, subject, body)` (Mock: just logs to console/file).
3.  Listen for `ORDER_PAID` events (requires Event Bus).

### Phase 2: Klaviyo Integration
1.  Replace mock `sendEmail` with Klaviyo API calls.
2.  Use Klaviyo Templates for design, Agent just injects text.

### Phase 3: Profit Analysis
1.  Update `AnalyticsAgent` to track "Email Revenue" separately from "Ad Revenue".
2.  Goal: Email Revenue should be 20-30% of Total Revenue.
