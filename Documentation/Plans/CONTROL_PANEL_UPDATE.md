# 📅 Plan: Control Panel Update (Product Research v2)

**Status:** Draft
**Owner:** Frontend / Ops
**Target:** Align UI with new 11-Step Research Pipeline

---

## 1. Objective
To update the internal "Control Panel" (`src/web/public`) to reflect the rigorous data structures and workflow of the new **Product Research Agent**.
Currently, the UI expects simple "Staging Items". We need it to display complex **Opportunity Briefs**.

---

## 2. Activity Log Enhancements (`activity.html`)

### Requirement
"All internal messages must be visible in agent logs... errors in error log."

### Action Items
1.  **Granular Pipeline Logging**:
    *   Ensure `ProductResearchAgent.ts` logs an entry for **each of the 11 steps**.
    *   *Example:* `Step 4: Theme Generation - Created 5 themes.`
2.  **Kill Switch Visibility**:
    *   When a theme is killed (Step 5 or 7), log it as a `WARNING` or `INFO` (not just debug).
    *   Include the specific **Kill Criteria** in the log `details` JSON.
3.  **Error Capture**:
    *   Verify `LiveTrendAdapter` and `LiveCompetitorAdapter` catch exceptions and write to `activity_log` with `status='failed'`.
    *   The existing `activity.js` already highlights `failed` status in red.

---

## 3. Research Dashboard Overhaul (`staging.html` -> `briefs.html`)

### Requirement
The current "Staging" view is outdated. It needs to show **Opportunity Briefs**.

### Action Items
1.  **Rename & Repurpose**:
    *   Rename `staging.html` to `briefs.html` (or update in place).
    *   Update API routes to fetch from `brief_store` (or the table where Briefs are saved).
2.  **New Table Columns**:
    *   **Theme Name** (was `name`)
    *   **Score** (0-100)
    *   **Trend Phase** (e.g., `Emerging`, `Peak`)
    *   **Status** (`New`, `Validated`, `Killed`)
3.  **Detail View (The "Brief Inspector")**:
    *   Add a "View" button to each row.
    *   Opens a Modal showing the full 14-section JSON.
    *   *Bonus:* Use a JSON formatter (like `highlight.js` or simple `<pre>`) for readability.

---

## 4. New Feature: Pipeline State Monitor

### Concept
A simple visual indicator of where the agent is in the 11-step process.

### Implementation
*   **Endpoint:** `GET /api/agent/research/status`
*   **UI:** A progress bar or step-stepper on `agents.html`.
*   **Data:** Derived from the latest `started` log entry for the current Request ID.

---

## 5. Execution Steps
1.  [ ] Audit `ProductResearchAgent.ts` logging calls.
2.  [ ] Update `staging.js` to render `OpportunityBrief` properties.
3.  [ ] Add JSON viewer modal to `staging.html`.
4.  [ ] Test with a simulation run to verify logs appear correctly.
