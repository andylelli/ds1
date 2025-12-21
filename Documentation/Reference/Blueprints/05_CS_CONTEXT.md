# 🧠 05. Context-Aware Customer Service

**Status:** Draft
**Date:** December 2025
**Objective:** Move from "Stateless Auto-Reply" to "Context-Aware Conversation" by giving the CS Agent a memory of past interactions.

## 1. The Problem
Currently, the `CustomerServiceAgent` treats every ticket as a brand new interaction.
*   **No Memory:** If a customer says "I still haven't received it", the agent doesn't know *what* they are referring to.
*   **No Continuity:** We cannot escalate issues effectively because we don't track the "temperature" of the conversation.

## 2. The Solution: Ticket Lifecycle Management

We introduce a relational structure for support data in Postgres.

### 2.1 Database Schema

#### `tickets` Table
```sql
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  customer_email VARCHAR(255) NOT NULL,
  order_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, PENDING_USER, RESOLVED, ESCALATED
  priority VARCHAR(20) DEFAULT 'NORMAL',
  sentiment_score INT DEFAULT 50,    -- 0 (Furious) to 100 (Happy)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `ticket_messages` Table
```sql
CREATE TABLE ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INT REFERENCES tickets(id),
  sender VARCHAR(50) NOT NULL,       -- 'CUSTOMER', 'AGENT', 'SYSTEM'
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 The Context Window Logic

When the `CustomerServiceAgent` wakes up to handle a new message, it constructs a **Context Window** for the LLM.

**Workflow:**
1.  **Trigger:** `TICKET_CREATED` or New Message Webhook.
2.  **Lookup:**
    *   Fetch `Ticket` metadata (Status, Order ID).
    *   Fetch last 10 `ticket_messages`.
    *   Fetch `Order` details (Shipping status, tracking #).
3.  **Prompt Construction:**
    ```text
    System: You are a helpful support agent.
    Context:
    - Order #123 is SHIPPED (Tracking: TRK999).
    - Customer Sentiment: FRUSTRATED (Score: 30).
    - History:
      User: Where is my stuff?
      Agent: It's on the way.
      User: It's been 2 weeks!
    Task: Reply to the user.
    ```
4.  **Action:** Generate reply and save to `ticket_messages`.

## 3. Escalation Matrix

We define rules to prevent the AI from looping endlessly with an angry customer.

| Condition | Action |
| :--- | :--- |
| Sentiment < 30 (Angry) | Set Priority = `HIGH`. Change Tone to "Apologetic". |
| Sentiment < 10 (Furious) | Set Priority = `CRITICAL`. **STOP AI**. Notify Admin/CEO. |
| Message Count > 5 | If unresolved, escalate to `HUMAN_REVIEW`. |

## 4. Implementation Plan

### Phase 1: Schema Migration
1.  Create `tickets` and `ticket_messages` tables.
2.  Update `PersistencePort` with `createTicket`, `addMessage`, `getTicketHistory`.

### Phase 2: Agent Logic
1.  Update `CustomerServiceAgent.handleTicket` to:
    *   Read history first.
    *   Calculate sentiment on the *new* message.
    *   Update the ticket status.

### Phase 3: Email Integration
1.  Connect `EmailPort` (SMTP/IMAP) to the Ticket System.
2.  Incoming Email -> New Message Row.
3.  Agent Reply -> Outgoing Email.
