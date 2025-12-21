# 🎧 08. Customer Service Agent (The Support Rep)

## 1. Executive Summary
The **Customer Service Agent** is the "Support Representative" dedicated to keeping customers happy. It handles post-purchase communication, answers inquiries, and manages support tickets without human intervention.

## 2. Core Responsibilities
*   **Customer Notification**: Sends transactional emails (e.g., "Your order has shipped") with tracking information.
*   **Ticket Triage**: Analyzes incoming support emails to detect sentiment (Positive, Neutral, Angry).
*   **Auto-Response**: Generates and sends appropriate responses to common questions (FAQs).
*   **Escalation**: Identifies "Angry" customers and flags them for human review or special handling.

## 3. Event Interface

### Subscribes To
| Event | Source | Action |
| :--- | :--- | :--- |
| `ORDER_SHIPPED` | Operations Agent | Triggers the "Shipping Confirmation" email. |
| `TICKET_CREATED` | Email System | Triggers the ticket analysis and response workflow. |

### Publishes
| Event | Payload | Description |
| :--- | :--- | :--- |
| `TICKET_RESOLVED` | `{ ticket_id, action }` | Emitted when a ticket is closed or escalated. |

## 4. Toolbox (MCP)

| Tool Name | Description | Parameters |
| :--- | :--- | :--- |
| `handle_ticket` | Analyzes and responds to a ticket. | `ticket_id`, `message` |
| `generate_faq` | Creates FAQ content for a product. | `product` (string) |
| `check_emails` | Polls inbox for new messages. | None |

## 5. Key Logic & Decision Making

### Sentiment Analysis
The agent performs a keyword-based sentiment check on incoming messages:
*   **Negative**: Contains words like "angry", "broken", "scam". -> **Action**: Escalate / Apologize.
*   **Neutral/Positive**: Standard inquiry. -> **Action**: Answer & Resolve.

### Notification System
Uses the `EmailPort` to send real or mock emails. In the current test environment, it logs the email content to the console instead of sending it via SMTP.

## 6. Current Status
*   **Implementation**: Mock.
*   **Logic**: The `CustomerServiceAgent` class is implemented.
*   **Adapters**:
    *   `MockEmailAdapter`: Simulates sending and receiving emails.
