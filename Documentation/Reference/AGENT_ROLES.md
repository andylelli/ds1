# 🤖 Agent Roles & Responsibilities

## 📖 Introduction
The DropShip AI (DS1) system operates as a **multi-agent swarm**, where specialized autonomous agents collaborate to build and manage a dropshipping business. Unlike a traditional monolithic script, each agent acts as a distinct "employee" with a specific persona, a limited set of responsibilities, and a unique toolkit.

This document serves as the definitive reference for each agent's role, defining what they do, what tools they can access, and how they interact with the rest of the system via the Event Bus.

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
