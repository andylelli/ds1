# 🛡️ Workflow 2: The Operations Engine (Defense)

**Objective:** To fulfill customer promises, resolve issues instantly, and maintain business continuity without human intervention.
**Trigger:** External Webhooks (Shopify, Stripe, Email) or Internal Alerts.
**Owner:** Operations Agent (Logistics) & Customer Service Agent (Support)

---

## 📊 Workflow Diagram

```mermaid
graph TD
    subgraph "Trigger: New Order"
        Webhook[Shopify Webhook] -->|Event: ORDER_RECEIVED| Ops[Phase 1: Operations Agent]
    end

    subgraph "Phase 1: Fulfillment"
        Ops -->|Tools: fulfill_order| Purchase[Place Order @ Supplier]
        Purchase -->|Tools: check_inventory| Check[Check Stock]
        Check -->|Event: ORDER_SHIPPED| Notify[Phase 2: CS Agent]
    end

    subgraph "Phase 2: Notification"
        Notify -->|Tools: email_tool| Email[Send Tracking Email]
        Email -->|Event: ORDER_COMPLETED| Done1[End: Order Complete]
    end

    subgraph "Trigger: Customer Support"
        Incoming[Incoming Email] -->|Event: TICKET_CREATED| CS[Phase 3: CS Agent]
    end

    subgraph "Phase 3: Resolution"
        CS -->|Tools: handle_ticket| Analyze[Analyze Sentiment]
        Analyze -- "Negative" --> Escalate[Escalate to Human]
        Analyze -- "Neutral" --> Reply[Auto-Reply]
        Reply -->|Event: TICKET_RESOLVED| Done2[End: Ticket Closed]
    end
```

---

## 📝 Detailed Steps & Technical Actions

### Phase 1: Order Fulfillment
*   **Actor:** `OperationsAgent`
*   **Trigger Event:** `ORDER_RECEIVED`
*   **MCP Tools / Actions:**
    *   `fulfill_order`: Places order with supplier (Mock or Real).
    *   `check_inventory`: Verifies stock levels.
*   **Output Event:** `ORDER_SHIPPED` (Payload: Tracking Number)

### Phase 2: Customer Notification
*   **Actor:** `CustomerServiceAgent`
*   **Trigger Event:** `ORDER_SHIPPED`
*   **MCP Tools / Actions:**
    *   `email_tool`: Sends shipping confirmation with tracking link.
*   **Output Event:** `ORDER_COMPLETED`

### Phase 3: Support Ticket Handling
*   **Actor:** `CustomerServiceAgent`
*   **Trigger Event:** `TICKET_CREATED`
*   **MCP Tools / Actions:**
    *   `handle_ticket`: Analyzes sentiment and generates response.
    *   `check_emails`: Polls for new messages.
*   **Output Event:** `TICKET_RESOLVED`

---
**Next Step:** Transaction data is analyzed in [**Workflow 3: Optimization**](./03_OPTIMIZATION.md).
*   **Logic:**
    1.  **Validation:** Check if address is valid and stock exists.
    2.  **Purchase:** Automatically buy the item from the supplier using the customer's address.
    3.  **Financials:** Log the expense immediately to track real-time profit.
*   **Output Event:** `SUPPLIER_ORDER_PLACED`
    *   **Payload:** `{ "shopify_order_id": "1001", "supplier_order_id": "ali_555", "cost": 12.50 }`

### Phase 2: Tracking Synchronization (Async)
*   **Actor:** `OperationsAgent`
*   **Trigger Event:** `SUPPLIER_SHIPPED` (Polled or Webhook from Supplier)
*   **MCP Tools / Actions:**
    *   `shopify.fulfillment_create(order_id, tracking_number)`: Mark order as fulfilled.
    *   `email_service.send_shipping_confirmation(customer_email)`: Notify customer.
*   **Logic:**
    1.  **Sync:** When supplier provides a tracking number, push it to Shopify.
    2.  **Notify:** Trigger the "Your Order is on the Way" email.
*   **Output Event:** `ORDER_FULFILLED`

### Phase 3: Support Triage & Context
*   **Actor:** `CustomerServiceAgent`
*   **Trigger Event:** `TICKET_CREATED` (Email or Chat)
*   **MCP Tools / Actions:**
    *   `ticket_db.get_history(customer_email)`: Fetch past conversations.
    *   `shopify.get_customer_orders(email)`: Check if they are a VIP or first-time buyer.
    *   `llm.analyze_sentiment(message)`: Score anger level (0-100).
*   **Logic:**
    1.  **Context Building:** "This is John. He bought a Neck Massager 3 days ago. It hasn't shipped yet. He is Angry (85/100)."
    2.  **Intent Recognition:** Is he asking for a Refund, Tracking, or Product Info?
*   **Output Event:** `TICKET_TRIAGED`
    *   **Payload:** `{ "ticket_id": "t_123", "intent": "refund_request", "sentiment": "angry", "priority": "high" }`

### Phase 4: Resolution Gate
*   **Actor:** `CustomerServiceAgent`
*   **Trigger Event:** `TICKET_TRIAGED`
*   **Logic:**
    *   **Standard:** "Where is my order?" -> Auto-Reply with tracking.
    *   **Critical:** "This product burned my neck!" -> Escalate to Human.
    *   **Refunds:** If < $20 and "Damaged", Auto-Refund. If > $50, Escalate.

### Phase 5: Auto-Reply (Standard)
*   **Actor:** `CustomerServiceAgent`
*   **Trigger Event:** `TICKET_TRIAGED` (if Standard)
*   **MCP Tools / Actions:**
    *   `llm.generate_reply(context, policy)`: Draft polite response.
    *   `helpdesk.send_reply(ticket_id, body)`: Send email/chat.
    *   `ticket_db.update_status(ticket_id, "solved")`: Close ticket.
*   **Output Event:** `TICKET_SOLVED`

### Phase 6: Escalation (Critical)
*   **Actor:** `CEOAgent` (Notification)
*   **Trigger Event:** `TICKET_ESCALATED`
*   **MCP Tools / Actions:**
    *   `admin_panel.send_alert(message, level="critical")`: Push notification to User phone.
    *   `slack.post_message(channel="#urgent", text)`: Notify team.
*   **Logic:**
    1.  **Freeze:** If multiple reports of "Burning", pause the Ad Campaign immediately (`CAMPAIGN_PAUSED`).
    2.  **Alert:** Wake up the human user.

---

## 🚦 Exception Handling

| Scenario | Trigger Event | Handler Agent | Action |
| :--- | :--- | :--- | :--- |
| **Supplier Out of Stock** | `ORDER_FAILED` | `OperationsAgent` | Find backup supplier. If none, email customer offering refund or wait. |
| **Invalid Address** | `ADDRESS_INVALID` | `CustomerServiceAgent` | Auto-email customer: "Please correct your address." |
| **Tracking Stuck** | `SHIPPING_DELAYED` | `OperationsAgent` | If > 10 days no movement, auto-refund or reship. |
| **Payment Dispute** | `CHARGEBACK_CREATED` | `OperationsAgent` | Auto-submit tracking proof to Stripe/PayPal via API. |
