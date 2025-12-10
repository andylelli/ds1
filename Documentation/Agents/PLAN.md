# 🗺️ Agent Roadmap & Status

## 🎯 Objective
This document tracks the lifecycle of the DropShip AI agents, from **Documentation** (defining the role) to **Implementation** (coding the logic) and **Integration** (connecting real APIs).

## 📊 Status Overview

| Agent | Documentation | Core Logic | Real APIs |
| :--- | :---: | :---: | :---: |
| **01. CEO** | ✅ | ✅ | 🚧 (Needs OpenAI) |
| **02. Analytics** | ✅ | ✅ | 🚧 (Needs Real DB) |
| **03. Research** | ✅ | ✅ | ❌ (Mock Only) |
| **04. Supplier** | ✅ | ✅ | ❌ (Mock Only) |
| **05. Store Build** | ✅ | ✅ | 🚧 (Partial Shopify) |
| **06. Marketing** | ✅ | ✅ | ❌ (Mock Only) |
| **07. Operations** | ✅ | ✅ | 🚧 (Stubbed) |
| **08. Customer Svc** | ✅ | ✅ | 🚧 (Stubbed) |

---

## 📅 Phase 1: Documentation (Completed)
*   [x] **Standardize all Agent Docs** (01-08 created).
*   [x] **Define Event Interfaces** for all workflows.

---

## 📅 Phase 2: Implementation (The "Real World" Upgrade)

### 🧠 Strategy Team
*   [ ] **CEO Agent**: Connect `OpenAiAdapter` to replace `MockAiAdapter`. Enable real decision-making.
*   [ ] **Analytics Agent**: Replace random number generation with real SQL queries to the `orders` and `events` tables.

### 🚀 Growth Team
*   [ ] **Product Research Agent**: Integrate **RapidAPI (Amazon/AliExpress)** to fetch real product data instead of returning hardcoded "Heated Jackets".
*   [ ] **Supplier Agent**: Integrate **AliExpress/CJ API** to find real suppliers and get actual shipping times.
*   [ ] **Store Build Agent**: Verify **Shopify API** connection. Ensure `create_product` pushes live to your store.
*   [ ] **Marketing Agent**: Integrate **Meta Marketing API**. Allow the agent to actually create a Draft Campaign in Facebook Ads Manager.

### 🛡️ Operations Team
*   [ ] **Operations Agent**: Implement **Real Fulfillment**. When `fulfill_order` is called, it should trigger a purchase on the supplier's end (or at least send an email to them).
*   [ ] **Customer Service Agent**: Connect **SMTP/Gmail**. Enable the agent to actually send emails to `customerEmail` addresses.

---

## 📅 Phase 3: Future Expansion (Planned Agents)
*   [ ] **`09_RETENTION_AGENT.md`**
    *   *Focus:* Email/SMS marketing (Klaviyo) to increase LTV.
*   [ ] **`10_CONTENT_CREATOR_AGENT.md`**
    *   *Focus:* Organic social content generation (TikTok/Reels).
*   [ ] **`11_COMPLIANCE_OFFICER.md`**
    *   *Focus:* Trademark checks and ad policy compliance.
*   [ ] **`12_CRO_SPECIALIST.md`**
    *   *Focus:* Landing page optimization and A/B testing.

## 🛠️ Action Items
1.  **Select an Agent** from Phase 2 to upgrade first (Recommended: **Product Research** or **CEO**).
2.  **Obtain API Keys** for the selected service (e.g., OpenAI, RapidAPI).
3.  **Update the Adapter** in `src/infra/` to use the real API.

