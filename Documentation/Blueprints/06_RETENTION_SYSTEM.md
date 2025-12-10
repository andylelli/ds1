# 🧠 06. Retention & Lifecycle System

**Status:** Draft
**Date:** December 2025
**Objective:** Maximize Customer Lifetime Value (LTV) through state-driven automated communications (Email/SMS).

## 1. The Problem
A "Churn and Burn" model is unsustainable. We need to transition customers from "One-time Buyers" to "Loyal VIPs".
*   **Current State:** No follow-up after purchase.
*   **Desired State:** Automated, personalized lifecycle marketing.

## 2. The Solution: Customer State Machine

We treat every customer as an entity moving through a Finite State Machine (FSM).

### 2.1 The States

| State | Definition | Trigger for Transition |
| :--- | :--- | :--- |
| `VISITOR` | Browsing, no cart action. | `ADD_TO_CART` -> `LEAD` |
| `LEAD` | Has items in cart, no purchase. | `ORDER_PAID` -> `CUSTOMER` |
| `CUSTOMER` | Made 1 purchase. | `ORDER_PAID` (2nd time) -> `REPEAT` |
| `REPEAT` | Made >1 purchases. | LTV > $500 -> `VIP` |
| `VIP` | High value customer. | No purchase in 90 days -> `AT_RISK` |
| `AT_RISK` | Was active, now fading. | No purchase in 180 days -> `CHURNED` |
| `CHURNED` | Lost customer. | `ORDER_PAID` -> `REACTIVATED` |

### 2.2 Database Schema

#### `customer_profiles` Table
```sql
CREATE TABLE customer_profiles (
  customer_email VARCHAR(255) PRIMARY KEY,
  state VARCHAR(50) DEFAULT 'VISITOR',
  total_spend DECIMAL(10, 2) DEFAULT 0.00,
  order_count INT DEFAULT 0,
  last_order_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `campaigns` Table
```sql
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  trigger_event VARCHAR(50), -- e.g., 'ENTERED_STATE_LEAD'
  channel VARCHAR(20),       -- 'EMAIL', 'SMS'
  template_body TEXT,
  delay_hours INT DEFAULT 0
);
```

#### `communications_log` Table
```sql
CREATE TABLE communications_log (
  id SERIAL PRIMARY KEY,
  customer_email VARCHAR(255),
  campaign_id INT,
  sent_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) -- 'SENT', 'OPENED', 'CLICKED'
);
```

## 3. The Retention Agent Logic

The `RetentionAgent` runs on two triggers: **Events** and **Schedules**.

### 3.1 Event-Driven (Real-time)
*   **Event:** `ORDER_PAID`
*   **Logic:**
    1.  Update `customer_profiles` (increment spend, set state).
    2.  Check for immediate campaigns (e.g., "Order Confirmation").
    3.  Dispatch Email via `EmailPort`.

### 3.2 Schedule-Driven (Daily Cron)
*   **Task:** `CheckChurnRisk`
*   **Logic:**
    1.  Query customers where `last_order_date` > 60 days ago AND state != `AT_RISK`.
    2.  Update state to `AT_RISK`.
    3.  Trigger "Win-Back" Campaign.

## 4. Implementation Plan

### Phase 1: Tracking
1.  Create `customer_profiles` table.
2.  Update `OrderProcessor` to upsert `customer_profiles` on every sale.

### Phase 2: The Engine
1.  Implement `RetentionAgent` with a `checkStateTransitions()` method.
2.  Create the "Abandoned Cart" flow (Trigger: `CART_UPDATED` + 1 hour timeout).

### Phase 3: Content Generation
1.  Use LLM to generate dynamic email content based on the products they bought.
    *   *Prompt:* "Write a care guide for the [Product Name] they just bought."
