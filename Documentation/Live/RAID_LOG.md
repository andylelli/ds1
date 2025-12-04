# 🛡️ RAID Log
**Project:** DropShip AI Agent Swarm (DS1)  
**Last Updated:** December 4, 2025

This document tracks **Risks**, **Assumptions**, **Issues**, and **Dependencies** to ensure project stability and foresight.

## 🔴 Risks (Future uncertain events with negative impact)
| ID | Risk Description | Impact (1-5) | Probability (1-5) | Mitigation Strategy |
| :--- | :--- | :---: | :---: | :--- |
| **R-01** | **API Account Bans**: Automated actions by agents (e.g., rapid ad creation) might trigger anti-bot bans on Meta/TikTok/Shopify. | 5 | 4 | Implement strict rate limiting; Use "Human-in-the-loop" approval for sensitive actions initially. |
| **R-02** | **Cost Overruns**: "Live Mode" agents might spend ad budget or API credits (OpenAI) uncontrollably if a loop bugs out. | 5 | 3 | Implement hard daily budget caps in code; Add a "Kill Switch" to `admin.html`. |
| **R-03** | **API Breaking Changes**: 3rd party APIs (Shopify, Meta) change frequently, potentially breaking the agents. | 4 | 3 | Use versioned APIs; Create a suite of "Connectivity Tests" to run daily. |
| **R-04** | **Model Hallucination**: Agents might generate policy-violating ad copy or incorrect product data. | 3 | 3 | Add a "Compliance Agent" layer to review content before posting. |

## 🟡 Assumptions (Things we believe to be true)
| ID | Assumption | Validation Date | Status |
| :--- | :--- | :---: | :--- |
| **A-01** | Mock traffic conversion rates (1-3%) are representative of real-world performance for initial tuning. | TBD | Open |
| **A-02** | We can obtain necessary API access (TikTok Ads, AliExpress) without a long verification process. | TBD | Open |
| **A-03** | The current Node.js single-process architecture can handle the load of a single store simulation. | 2025-12-04 | Valid |

## 🟠 Issues (Current problems that need solving)
| ID | Issue Description | Priority | Owner | Status |
| :--- | :--- | :---: | :---: | :--- |
| **I-01** | **Linear Execution**: The simulation runs sequentially. If one step hangs, the whole business stops. | High | Dev | Open |
| **I-02** | **Lack of Persistence**: `sandbox_db.json` is not suitable for long-term data storage or complex queries. | Medium | Dev | Open |

## 🔵 Dependencies (External factors we rely on)
| ID | Dependency | Impact if Missing | Status |
| :--- | :--- | :--- | :--- |
| **D-01** | **OpenAI API Key**: Required for all agent "thinking" and content generation. | Critical | ✅ Active |
| **D-02** | **Shopify Partner Account**: Required to create development stores and test APIs. | Critical | 🚧 Pending |
| **D-03** | **Meta Business Manager**: Required to generate real ad tokens. | High | 🚧 Pending |
