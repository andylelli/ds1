# 🤖 Agent Roles & Responsibilities

## 📖 Introduction
The DropShip AI (DS1) system operates as a **multi-agent swarm**, where specialized autonomous agents collaborate to build and manage a dropshipping business. Unlike a traditional monolithic script, each agent acts as a distinct "employee" with a specific persona, a limited set of responsibilities, and a unique toolkit.

This document serves as the definitive reference for each agent's role, defining what they do, what tools they can access, and how they interact with the rest of the system.

The system relies on two core architectural pillars:
1.  **Event Bus:** An asynchronous messaging backbone that allows agents to react to system changes (e.g., `ORDER_PAID`) without tight coupling.
2.  **Model Context Protocol (MCP):** A standardized interface that gives agents safe, structured access to external tools (Shopify, Meta Ads, Database) and local resources.

---

## 🧩 Agent Definition Template
*Use the following structure when defining or updating an agent's reference section.*

### 👤 [Agent Name]
**Role:** [The agent's persona, e.g., "The Strategist" or "The Builder"]
**Objective:** [A single sentence defining their primary measure of success]

#### 📋 Key Responsibilities
*   **[Responsibility 1]:** Description of the task.
*   **[Responsibility 2]:** Description of the task.

#### 🛠️ Tools & Capabilities
*   `tool.name()`: Description of what this tool allows the agent to do.
*   `tool.name()`: Description of what this tool allows the agent to do.

#### ⚡ Event Interactions
*   **Listens For:** `EVENT_NAME`, `EVENT_NAME`
*   **Emits:** `EVENT_NAME`, `EVENT_NAME`

---

### 👔 CEO Agent
**Role:** The Orchestrator & Strategic Lead
**Objective:** To oversee the entire business lifecycle, ensuring agents collaborate effectively to achieve profitability while managing risk.

#### 📋 Key Responsibilities
*   **Workflow Orchestration:** Triggers the core business workflows (Growth, Operations, Optimization) based on schedules or user commands. It ensures that hand-offs between agents (e.g., Research -> Sourcing) happen smoothly.
*   **Approval Gatekeeper:** Reviews product research data (margin, competition) and makes the final "Go/No-Go" decision before resources are committed. It acts as the final check against "hallucinated" opportunities.
*   **Crisis Management:** Acts as the escalation point for critical issues (e.g., angry customers, supplier failures, rapid budget drain) that require executive intervention or human alert.
*   **Reporting Interface:** Serves as the primary conversational interface for the human user. It synthesizes logs from all other agents into coherent status updates, translating technical logs into business insights.

#### 🛠️ Tools & Capabilities
*   `ceo.chat(message)`: Analyzes system-wide logs to answer human queries about business health.
*   `ceo.approve_product(productId)`: Authorizes the Store Builder and Marketing agents to proceed with a launch.
*   `ceo.reject_product(productId)`: Terminates a product candidate to prevent wasted ad spend.
*   `ceo.pause_simulation()`: Emergency stop mechanism that halts all agent activities.
*   `ceo.get_status_report()`: Compiles a high-level summary of active products, daily revenue, and pending alerts.

#### ⚡ Event Interactions
*   **Listens For:** `USER_COMMAND`, `RESEARCH_COMPLETED`, `ESCALATION_TRIGGERED`, `DAILY_REPORT_REQUESTED`
*   **Emits:** `WORKFLOW_STARTED`, `PRODUCT_APPROVED`, `PRODUCT_REJECTED`, `CAMPAIGN_PAUSED`, `REPORT_GENERATED`

---
