# PMO Maintenance Plan

## 1. Objective
To ensure that the Project Management Office (PMO) documentation remains a reliable, up-to-date source of truth for the project's status, risks, decisions, and financial health. This plan establishes the standards, templates, and routines for maintaining these artifacts, ensuring that both human operators and AI agents have a shared understanding of the project state.

## 2. The PMO Artifacts
The following documents are the core of the PMO and must be maintained according to this plan.

| Document | Purpose | Key Content Requirements | Update Frequency |
| :--- | :--- | :--- | :--- |
| **PROJECT_STATUS.md** | High-level executive summary of progress. | • Overall RAG Status<br>• Key Achievements (Last 7 Days)<br>• Upcoming Milestones<br>• Blocker Summary | Weekly |
| **RAID_LOG.md** | Risks, Assumptions, Issues, and Dependencies. | • **Risk**: Impact/Probability score.<br>• **Issue**: Owner & ETA.<br>• **Dependency**: Blocking item ID. | Weekly / As Issues Arise |
| **DECISION_LOG.md** | Record of architectural and strategic decisions. | • Context (Why?)<br>• Options Considered<br>• Decision Made<br>• Consequences (Pros/Cons) | Ad-hoc (Immediately upon decision) |
| **BUDGET_TRACKER.md** | Tracking of API costs and cloud spend. | • OpenAI Token Usage/Cost<br>• Azure Resource Cost<br>• 3rd Party API Fees (SerpApi, etc.)<br>• Monthly Burn Rate | Monthly (or upon major spend) |
| **TECHNICAL_DEBT.md** | Log of shortcuts taken and refactoring needed. | • Location (File/Module)<br>• Severity (High/Med/Low)<br>• Estimated Fix Effort<br>• "Definition of Done" for the fix | Ad-hoc (During coding) |
| **THINGS_TO_DO.md** | Backlog of tasks. | • Priority Order<br>• Status Tags<br>• Links to relevant specs | Daily/Weekly |

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
*   🔴 **Critical / Blocked**: Immediate attention required. Work cannot proceed.
*   🟡 **At Risk / In Progress**: Attention required, or work is underway but not finished.
*   🟢 **On Track / Completed**: Proceeding as planned or finished.
*   ⚪ **Not Started / Proposed**: Backlog item.

### 3.3 Decision Record Template (ADR)
When updating `DECISION_LOG.md`, use the following structure for clarity:
```markdown
### [ID] Title of Decision
*   **Status:** [Proposed/Accepted/Deprecated]
*   **Date:** YYYY-MM-DD
*   **Context:** What was the problem? What were the constraints?
*   **Decision:** What did we choose to do?
*   **Consequences:** What becomes easier? What becomes harder? (Trade-offs)
```

## 4. Maintenance Routines

### 4.1 The "Weekly PMO Sweep"
**When:** Every Friday (or end of Sprint).
**Owner:** Project Lead / AI Assistant
**Checklist:**
1.  **Update `PROJECT_STATUS.md`**:
    *   Summarize key achievements of the week.
    *   Update overall RAG (Red/Amber/Green) status.
2.  **Review `RAID_LOG.md`**:
    *   Close resolved issues.
    *   Add new risks identified during the week.
    *   Escalate "At Risk" items to "Critical" if deadlines are missed.
3.  **Review `TECHNICAL_DEBT.md`**:
    *   Did we add any `// TODO` comments in the code? Add them here.
    *   Prioritize one debt item for the next sprint.
4.  **Update Change Logs**: Record the sweep in each file modified.

### 4.2 The "Decision Trigger"
**When:** A significant architectural or business decision is made (e.g., "Switching from CosmosDB to Postgres", "Changing Agent Framework").
**Action:**
1.  Open `DECISION_LOG.md`.
2.  Add a new entry using the ADR template (Section 3.3).
3.  Update the Change Log.

### 4.3 The "Pre-Development Check"
**When:** Before starting a new major feature or module.
**Action:**
1.  Check `THINGS_TO_DO.md` to confirm priority.
2.  Check `TECHNICAL_DEBT.md` to see if this feature touches fragile code.
3.  Check `RAID_LOG.md` for dependencies (e.g., "Is the API key available?").

## 5. Roles & Responsibilities

| Role | Responsibility |
| :--- | :--- |
| **Human Operator** | • Strategic decisions.<br>• Budget approval.<br>• Final sign-off on Project Status. |
| **AI Assistant (Copilot)** | • Executing the "Weekly Sweep".<br>• Formatting entries.<br>• Reminding the user to log decisions.<br>• Scanning code for TODOs to populate Tech Debt. |

## 6. Implementation Plan (Immediate Actions)

To bring the current PMO folder up to this standard:

1.  **Audit**: Review all files in `Documentation/PMO/`.
2.  **Standardize**: Add the `## Change Log` table to the bottom of every file.
3.  **Clean Up**: Move outdated or static documents (like `EXTERNAL_ENDPOINTS.md`) to `Documentation/Reference/` or `Documentation/Archive/` if they are no longer active management tools.
4.  **Baseline**: Add an initial entry to all Change Logs: "Baseline established per PMO Maintenance Plan."
