# 📅 Plan: Documentation Audit & Cleanup

**Status:** Draft
**Owner:** Documentation Team
**Objective:** Ensure all reference documentation is accurate, relevant, and reflects the current state of the codebase (v1.0).

---

## 1. Objective
The DropShip project has evolved significantly. Many documents in the `Documentation/` folder may be outdated, referring to "planned" features that are now implemented, or "deprecated" architectures that have been replaced.
The goal is to **Audit, Update, or Delete** every file to ensure the `Documentation/Reference` folder is a single source of truth.

---

## 2. Audit Methodology

For each document, we will apply the **R.U.D.** process:

1.  **R - Review**: Read the document and compare it against the current codebase (`src/`).
2.  **U - Update**: If the core concept is valid but details are wrong (e.g., old file paths, missing new adapters), update it.
3.  **D - Delete**: If the document describes a feature we abandoned or is entirely superseded by a newer doc, delete it.

### Criteria for "Relevant"
*   Does it describe the *current* system architecture?
*   Is it useful for a new developer joining today?
*   Does it accurately reflect the "Live vs. Simulation" modes?

---

## 3. Scope & Checklist

### 3.1 Core Reference (`Documentation/Reference/`)
| Document | Status | Action Needed | Notes |
| :--- | :--- | :--- | :--- |
| `AGENT_ROLES.md` | 🟢 Up-to-Date | None | Updated to match actual tools and events in `src/agents/`. |
| `DEPLOYMENT_GUIDE.md` | 🟢 Up-to-Date | None | Updated API routes and added Postgres/Cosmos warning. |
| `DUMMIES_GUIDE.md` | 🟢 Up-to-Date | None | Updated tool names, added Cosmos/Postgres warning, and linked to Deployment Guide. |
| `ENVIRONMENT_SIMULATION_V_LIVE.md` | 🟢 Up-to-Date | None | Updated to match v1.0 adapter names and agent list. |
| `FUTURE_ENHANCEMENTS.md` | 🟢 Up-to-Date | None | Added status legend and marked P&L as Done. |
| `GOOGLE_ADS_ADAPTER_REFERENCE.md` | 🟢 Up-to-Date | None | Just updated. |
| `INTERFACE_DESIGN.md` | 🟢 Up-to-Date | None | Verified against `public/admin.html` and `public/staging.html`. |
| `INVESTOR_OVERVIEW.md` | 🟢 Up-to-Date | None | Updated Database (Postgres) and Security sections. |
| `LOGGING_REFERENCE.md` | 🟢 Up-to-Date | None | Just updated. |
| `MCP_EXPLAINED.md` | 🟢 Up-to-Date | None | Verified against `src/core/mcp/server.ts`. |
| `TTS_STYLE_GUIDE.md` | 🟢 Up-to-Date | None | Style guide for documentation, still relevant. |
| `USER_STORIES.md` | 🟢 Up-to-Date | None | Updated file paths, database refs, and event bus logic. |

### 3.2 Root Documentation (`Documentation/`)
| Document | Status | Action Needed | Notes |
| :--- | :--- | :--- | :--- |
| `ARCHITECTURE_REFERENCE.md` | 🟢 Up-to-Date | None | Updated to match v1.0 file structure (Agents, Adapters, API). |
| `GAP_ANALYSIS.md` | 🟢 Up-to-Date | None | Marked all items as Completed (v1.0). |
| `HOW_TO_PLAY.md` | ❓ Pending | Review | Is this for the simulation game mode? |
| `PLAN.md` | ❓ Pending | Review | Is this the master plan? Update or Archive. |

### 3.3 Agent Specific (`Documentation/Agents/`)
*   Review all `01_...` through `08_...` markdown files.
*   Ensure they match the code in `src/agents/`.
*   *Note:* `03_PRODUCT_RESEARCH_AGENT.md` was recently updated.

---

## 4. Execution Steps

1.  **Phase 1: Architecture & Environment (High Priority)**
    *   Audit `ARCHITECTURE_REFERENCE.md`.
    *   Audit `ENVIRONMENT_SIMULATION_V_LIVE.md`.
    *   Ensure the "Live vs Mock" distinction is crystal clear.

2.  **Phase 2: Agent Documentation**
    *   Walk through each Agent file in `Documentation/Agents/`.
    *   Verify the "Inputs", "Outputs", and "Tools" listed match the TypeScript classes.

3.  **Phase 3: Cleanup**
    *   Delete empty folders or zip files (e.g., `product_research_agent_docs_v1.zip`).
    *   Archive completed plans in `Documentation/Plans/` (or delete if no longer needed).

4.  **Phase 4: Final Polish**
    *   Update `README.md` in the root to point to the refreshed documentation.

---

## 5. Definition of Done
*   All files in `Documentation/Reference` are marked "🟢 Up-to-Date".
*   No files refer to code that no longer exists.
*   `ARCHITECTURE_REFERENCE.md` is the definitive guide to the system.
