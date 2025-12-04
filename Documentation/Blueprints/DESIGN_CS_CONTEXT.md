# 🧠 Deep Think: Context-Aware Customer Service System

**Status:** Draft
**Date:** December 2025
**Objective:** Move from "Stateless Auto-Reply" to "Context-Aware Conversation" for Customer Service.

## 1. The Problem
Currently, the `CustomerServiceAgent` treats every ticket as a brand new interaction.
- **No Memory:** If a customer replies "I still haven't received it", the agent doesn't know *what* they haven't received.
- **No Context:** The agent doesn't know if this is a VIP customer or a serial refunder.
- **No Continuity:** We cannot escalate issues effectively because we don't track the "temperature" of the conversation.

## 2. The Solution: Ticket Lifecycle Management

We need a dedicated subsystem to manage the lifecycle of a support request.

### 2.1 Data Schema (Proposed)

We will extend our JSON DB (or move to SQLite) with two new collections: `Tickets` and `Messages`.

#### `Ticket` Object
```json
{
  "id": "TICK-8821",
  "customerId": "cust_555",
  "orderId": "ORD-102",
  "status": "open",          // open, pending_customer, resolved, closed
  "priority": "normal",      // low, normal, high, critical
  "sentimentScore": 75,      // 0 (Furious) to 100 (Happy)
  "tags": ["shipping_delay", "refund_request"],
  "createdAt": "2025-12-04T10:00:00Z",
  "updatedAt": "2025-12-04T14:30:00Z",
  "assignedTo": "CustomerServiceAgent" // or "Human"
}
```

#### `Message` Object
```json
{
  "id": "MSG-001",
  "ticketId": "TICK-8821",
  "sender": "customer",      // or "agent", "system"
  "content": "Where is my package? It's been 2 weeks.",
  "timestamp": "2025-12-04T10:00:00Z"
}
```

### 2.2 The "Context Window" Logic

When the `CustomerServiceAgent` wakes up to handle a ticket, it must perform a **Context Lookup** phase before generating a response.

**Workflow:**
1.  **Trigger:** New message arrives (simulated or real webhook).
2.  **Lookup:**
    *   Fetch `Ticket` metadata (Status, Order ID).
    *   Fetch last 5-10 `Messages` for this `ticketId`.
    *   Fetch `Order` details (Shipping status, tracking #).
3.  **Prompt Construction:**
    *   *System Prompt:* "You are a helpful assistant..."
    *   *Context Block:*
        > **Ticket History:**
        > Customer (10:00): Where is it?
        > Agent (10:05): It's on the way.
        > Customer (Today): Still not here.
        > **Order Status:** Shipped (Delayed).
4.  **Generation:** Agent generates response based on *full history*.
5.  **Action:**
    *   Send reply.
    *   Update `Ticket` status (e.g., if Agent asks a question -> `pending_customer`).
    *   Update `sentimentScore` based on the customer's latest message.

### 2.3 Escalation Matrix

We need rules to prevent the AI from looping endlessly with an angry customer.

| Condition | Action |
| :--- | :--- |
| Sentiment < 30 (Angry) | Set Priority = `High`. Change Tone to "Apologetic". |
| Sentiment < 10 (Furious) | Set Priority = `Critical`. **STOP AI**. Notify Admin/CEO. |
| Message Count > 5 | If unresolved, escalate to `Human Review`. |
| Keyword "Chargeback" | Immediate Escalation. |

## 3. Implementation Plan

### Phase 1: The `TicketManager` Class
Create a helper class in `src/lib/ticketManager.js` to handle the CRUD operations. This keeps the Agent code clean.

### Phase 2: Simulation Integration
Update `problemEvents.js` to not just "fire and forget" an email, but to **create a Ticket** in the DB.
Update `simulation.js` to have a "Ticketing Tick" where the CS Agent processes open tickets.

### Phase 3: The Agent Upgrade
Refactor `CustomerServiceAgent` to use the new `TicketManager`.
