# UI Migration Plan: Custom CSS to Bulma

This document outlines the strategy for migrating the DS1 Control Panel from custom CSS (`admin.css`) to the **Bulma CSS Framework**.

## 🎯 Objectives
- Modernize the UI with a consistent, responsive framework.
- Reduce custom CSS maintenance.
- Improve visual hierarchy and readability.
- Ensure all existing functionality (Sidebar, Tabs, Charts, Logs) remains intact.

## 🛠️ Preparation

1.  **Asset Setup**
    - Copy `src/css/bulma.css` to `public/css/bulma.css`.
    - Create `public/css/overrides.css` for DS1-specific tweaks (e.g., sidebar layout, specific colors).

2.  **Backup**
    - Ensure all `public/*.html` files are committed/backed up before starting.

## 🎨 Component Mapping

| Component | Current Custom CSS | Bulma Equivalent | Notes |
| :--- | :--- | :--- | :--- |
| **Container** | `.main` | `.section` | May need custom margin for sidebar. |
| **Card** | `.card` | `.card` > `.card-content` | Bulma cards need a content wrapper. |
| **Button (Primary)** | `button` | `.button.is-primary` | |
| **Button (Secondary)** | `button.secondary` | `.button` | |
| **Input** | `input` | `.input` | Must be wrapped in `.control`. |
| **Select** | `select` | `.select` > `select` | Must be wrapped in `.control`. |
| **Table** | `table` | `.table.is-fullwidth.is-striped` | |
| **Badge** | `.badge` | `.tag` | `.badge-green` -> `.tag.is-success` |
| **Grid** | `.grid` | `.columns.is-multiline` | |
| **Sidebar** | Custom `<nav>` | `.menu` | Use Bulma's menu component structure. |
| **Titles** | `.page-title` | `.title` | |

## 📝 Execution Steps

### Phase 1: Infrastructure & Layout (✅ Complete)
1.  **File Movement**: Move `bulma.css` to `public/css/`.
2.  **Sidebar Update (`sidebar.js`)**:
    - Refactor `initSidebar()` to generate Bulma-compatible HTML (`.menu`, `.menu-list`, `.menu-label`).
    - Update layout CSS to handle the fixed sidebar with Bulma.

### Phase 2: Page Migration (✅ Complete)
For each page, replace `<link rel="stylesheet" href="admin.css">` with Bulma + Overrides, and update HTML structure.

#### 1. `admin.html` (Control Panel)
- **Tabs**: Convert to Bulma `.tabs.is-boxed`.
- **Cards**: Wrap content in `.card-content`.
- **Buttons**: Add `.button` classes.
- **Chat**: Update chat bubble styles (Bulma doesn't have native chat, keep custom or use `.message`).

#### 2. `agents.html` (Agent Monitor)
- **Grid**: Convert to `.columns`.
- **Tags**: Convert `.tag-sub`, `.tag-cap` to Bulma tags (`.tag.is-info`, `.tag.is-warning`).

#### 3. `infra.html` (Infrastructure)
- **Table**: Add `.table` class.
- **Forms**: Wrap selects in `.select` and `.control`.

#### 4. `shop.html` (Mock Shop)
- **Product Cards**: Update to Bulma card structure.
- **Images**: Use `.card-image` > `.image.is-4by3`.

#### 5. `social.html` (Social Feed)
- **Layout**: Keep custom phone wrapper but use Bulma for internal layout if applicable.
- **Tabs**: Use Bulma tabs.

#### 6. `staging.html` (Research Staging)
- **Table**: Update to `.table`.
- **Progress Bars**: Use `.progress` component.

#### 7. `activity.html` (Logs)
- **Filters**: Update form controls to Bulma structure.
- **Log Entries**: Use `.box` or `.notification` for entries.

### Phase 3: Cleanup (✅ Complete)
1.  Remove `admin.css`.
2.  Verify all pages using `src/qa-automation.ts` (ensure no functional regressions).
3.  Manual visual check of all pages.

## ⚠️ Risks & Mitigations
- **Risk**: Sidebar navigation logic relies on specific classes.
- **Mitigation**: Update `sidebar.js` carefully and test navigation immediately.
- **Risk**: Custom "Chat" UI in `admin.html` might break.
- **Mitigation**: Retain specific chat CSS in `overrides.css`.

## 📅 Timeline
- **Step 1**: Setup & Sidebar (20 mins)
- **Step 2**: Admin Dashboard (30 mins)
- **Step 3**: Secondary Pages (40 mins)
- **Step 4**: QA & Polish (20 mins)
