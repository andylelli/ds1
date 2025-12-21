# 🛡️ RAID Log
**Project:** DropShip AI Agent Swarm (DS1)  
**Last Updated:** December 21, 2025

This document tracks **Risks**, **Assumptions**, **Issues**, and **Dependencies** to ensure project stability and foresight.

## 🔴 Risks (Future uncertain events with negative impact)
| ID | Risk Description | Impact (1-5) | Probability (1-5) | Mitigation Strategy | Status |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **R-01** | **API Account Bans**: Automated actions by agents (e.g., rapid ad creation) might trigger anti-bot bans on Meta/TikTok/Shopify. | 5 | 4 | Implement strict rate limiting; Use "Human-in-the-loop" approval for sensitive actions initially. | 🟡 Active |
| **R-02** | **Cost Overruns**: "Live Mode" agents might spend ad budget or API credits (OpenAI) uncontrollably if a loop bugs out. | 5 | 3 | Implement hard daily budget caps in code; Add a "Kill Switch" to `admin.html`. | 🟡 Active |
| **R-03** | **API Breaking Changes**: 3rd party APIs (Shopify, Meta) change frequently, potentially breaking the agents. | 4 | 3 | Use versioned APIs; Create a suite of "Connectivity Tests" to run daily. | 🟡 Active |
| **R-04** | **Model Hallucination**: Agents might generate policy-violating ad copy or incorrect product data. | 3 | 3 | Add a "Compliance Agent" layer to review content before posting. | 🟡 Active |
| **R-05** | **Runaway Feedback Loops**: `AnalyticsAgent` might react to a temporary market dip (simulated or real) by aggressively increasing ad spend, draining funds. | 5 | 3 | Implement "Circuit Breakers" that freeze spending if ROAS drops below 1.0 for >1 hour. | 🟡 Active |
| **R-06** | **OAuth Token Expiry**: Long-running agents will fail if access tokens (Shopify/Meta) expire and refresh logic is missing. | 5 | 5 | Implement robust OAuth2 token refresh handlers in the `BaseAgent` class. | 🟡 Active |
| **R-07** | **GDPR/Privacy Leaks**: Logging real customer PII (names, addresses) to text files or console violates privacy laws. | 5 | 5 | Implement PII redaction in the `saveAgentLog` function before "Live Mode". | 🟡 Active |
| **R-08** | **Database Connection Failure**: In "Live Mode", if the Postgres DB is unreachable, the app might crash or lose data. | 5 | 2 | Implement connection retry logic and fallback to local buffering/queueing. | 🟡 Active |

## 🟡 Assumptions (Things we believe to be true)
| ID | Assumption | Validation Date | Status |
| :--- | :--- | :---: | :--- |
| **A-01** | Mock traffic conversion rates (1-3%) are representative of real-world performance for initial tuning. | TBD | 🟡 Open |
| **A-02** | We can obtain necessary API access (TikTok Ads, AliExpress) without a long verification process. | TBD | 🟡 Open |
| **A-03** | The current Node.js single-process architecture can handle the load of a single store simulation. | 2025-12-04 | 🟢 Valid |
| **A-04** | **LLM Context Limits**: We assume standard context windows (128k) are sufficient for agent memory. | TBD | 🔴 Risk |
| **A-05** | **Supplier Integrity**: We assume supplier APIs return accurate inventory levels (often false in dropshipping). | TBD | 🔴 Risk |
| **A-06** | **Database Availability**: We assume the user has a local Postgres instance or Azure Cosmos DB for "Live" mode. | 2025-12-05 | 🟢 Valid |

## 🟠 Issues (Current problems that need solving)
| ID | Issue Description | Priority | Owner | Status |
| :--- | :--- | :---: | :---: | :--- |
| **I-01** | **Linear Execution**: The simulation runs sequentially. If one step hangs, the whole business stops. | High | Dev | 🟡 Open |
| **I-02** | **Lack of Persistence**: `sandbox_db.json` is not suitable for long-term data storage or complex queries. | Medium | Dev | 🟢 Closed |
| **I-03** | **Hardcoded Business Logic**: Traffic simulation parameters (CPC, CR) are hardcoded, making it hard to test different niches. | Low | Dev | 🟡 Open |
| **I-04** | **Browser Caching**: API responses were being cached, causing the Admin Panel to show stale data. | Medium | Dev | 🟢 Closed |

## 🔵 Dependencies (External factors we rely on)
| ID | Dependency | Impact if Missing | Status |
| :--- | :--- | :--- | :--- |
| **D-01** | **OpenAI API Key**: Required for all agent "thinking" and content generation. | Critical | 🟢 Active |
| **D-02** | **Shopify Partner Account**: Required to create development stores and test APIs. | Critical | 🟡 Pending |
| **D-03** | **Meta Business Manager**: Required to generate real ad tokens. | High | 🟡 Pending |
| **D-04** | **Payment Gateway (Stripe)**: Dropshipping accounts are high-risk and prone to rejection. | Critical | 🔴 Missing |
| **D-05** | **PostgreSQL Database**: Required for "Live Mode" persistence. | High | 🟢 Active |

## Change Log
| Date | Author | Change Description |
| :--- | :--- | :--- |
| 2025-12-21 | GitHub Copilot | Standardized format per PMO Maintenance Plan. Updated status of DB/OpenAI dependencies. |
