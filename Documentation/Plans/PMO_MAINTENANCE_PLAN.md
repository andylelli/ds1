# PMO Maintenance Plan

## 1. Objective
To ensure that the Project Management Office (PMO) documentation remains a reliable, up-to-date source of truth for the project's status, risks, decisions, and financial health. This plan establishes the standards and routines for maintaining these artifacts.

## 2. The PMO Artifacts
The following documents are the core of the PMO and must be maintained according to this plan:

| Document | Purpose | Update Frequency |
| :--- | :--- | :--- |
| **PROJECT_STATUS.md** | High-level executive summary of progress. | Weekly |
| **RAID_LOG.md** | Risks, Assumptions, Issues, and Dependencies. | Weekly / As Issues Arise |
| **DECISION_LOG.md** | Record of architectural and strategic decisions. | Ad-hoc (Immediately upon decision) |
| **BUDGET_TRACKER.md** | Tracking of API costs and cloud spend. | Monthly (or upon major spend) |
| **TECHNICAL_DEBT.md** | Log of shortcuts taken and refactoring needed. | Ad-hoc (During coding) |
| **THINGS_TO_DO.md** | Backlog of tasks (if not using an external tool). | Daily/Weekly |

## 3. Documentation Standards

### 3.1 The Change Log Requirement
**Every** PMO document must include a `## Change Log` section at the bottom of the file. This ensures an audit trail of who changed what and when.

**Format:**
```markdown
## Change Log
| Date | Author | Change Description |
| :--- | :--- | :--- |
| YYYY-MM-DD | [Name/Agent] | [Brief description of update] |
```

### 3.2 Status Indicators
Documents tracking items (like RAID or Tech Debt) must use clear status indicators:
*   🔴 **Critical / Blocked**
*   🟡 **At Risk / In Progress**
*   🟢 **On Track / Completed**
*   ⚪ **Not Started / Proposed**

## 4. Maintenance Routines

### 4.1 The "Weekly PMO Sweep"
**When:** Every Friday (or end of Sprint).
**Checklist:**
1.  **Update `PROJECT_STATUS.md`**:
    *   Summarize key achievements of the week.
    *   Update overall RAG (Red/Amber/Green) status.
2.  **Review `RAID_LOG.md`**:
    *   Close resolved issues.
    *   Add new risks identified during the week.
3.  **Review `TECHNICAL_DEBT.md`**:
    *   Did we add any `// TODO` comments in the code? Add them here.
4.  **Update Change Logs**: Record the sweep in each file modified.

### 4.2 The "Decision Trigger"
**When:** A significant architectural or business decision is made (e.g., "Switching from CosmosDB to Postgres").
**Action:**
1.  Open `DECISION_LOG.md`.
2.  Add a new entry using the ADR (Architecture Decision Record) format or the simplified table.
3.  Update the Change Log.

## 5. Implementation Plan (Immediate Actions)

To bring the current PMO folder up to this standard:

1.  **Audit**: Review all files in `Documentation/PMO/`.
2.  **Standardize**: Add the `## Change Log` table to the bottom of every file.
3.  **Clean Up**: Move outdated or static documents (like `EXTERNAL_ENDPOINTS.md`) to `Documentation/Reference/` or `Documentation/Archive/` if they are no longer active management tools.
4.  **Baseline**: Add an initial entry to all Change Logs: "Baseline established per PMO Maintenance Plan."
