# Control Panel Integration & Verification Plan

This plan outlines the steps to verify and refine the integration between the DS1 Control Panel (`admin.html`) and the backend system, ensuring strict separation between Simulation and Live modes.

## Phase 1: UI/UX & Conditional Rendering (Frontend)

**Objective:** Ensure the interface adapts dynamically to the server mode (`simulation` vs `live`).

- [x] **Sidebar Logic Verification**
    - [x] Verify `sidebar.js` fetches `/api/config` on load.
    - [x] **Simulation Mode:** Confirm "Run Simulation" and "Staging Review" links are **visible**.
    - [x] **Live Mode:** Confirm "Run Simulation" and "Staging Review" links are **hidden**.
    - [x] Verify "Business" (Products, Orders, Ads) and "System" (Activity, Infra) links are visible in **both** modes.

- [x] **Tab Visibility & Protection**
    - [x] **Simulation Tab:** Ensure `#simulation` div is hidden by default in HTML.
    - [x] **Direct Access Check:** If a user navigates to `#simulation` while in Live mode, redirect them to `#products` or show an "Access Denied" message.
    - [x] **Default Landing:**
        - [x] Sim Mode: Defaults to `#simulation`.
        - [x] Live Mode: Defaults to `#products`.

- [x] **Visual Indicators**
    - [x] Verify the Sidebar Header displays the correct badge ("SIMULATION MODE" vs "LIVE MODE").
    - [x] Verify the CEO Chat status badge reflects the correct agent mode.

## Phase 2: API Integration & Data Flow (Backend Connection)

**Objective:** Ensure UI controls trigger the correct backend services and display the correct data sources.

- [x] **Simulation Endpoints (Sim Mode Only)**
    - [x] **Start:** Test `POST /api/simulation/start`. Verify it triggers `SimulationService.runSimulationFlow()`.
    - [x] **Clear:** Test `POST /api/simulation/clear`. Verify it wipes the `dropship_sim` database.
    - [x] **Logs:** Test `GET /api/logs`. Verify it returns logs from the `activity_log` table (Sim DB).

- [x] **Business Data Endpoints (Dual Mode)**
    - [x] **Products:** Test `GET /api/products`. Ensure it queries the correct DB (`dropship_sim` vs `dropship`) based on the active container configuration.
    - [x] **Orders:** Test `GET /api/orders`. Verify correct DB source.
    - [x] **Ads:** Test `GET /api/ads`. Verify correct DB source.

- [x] **CEO Chat Integration**
    - [x] Test `POST /api/ceo/chat`.
    - [x] **Sim Mode:** Verify it talks to the Mock/Sim CEO Agent.
    - [x] **Live Mode:** Verify it talks to the Real CEO Agent (Azure OpenAI).

- [x] **Infrastructure Control**
    - [x] Test `GET /api/docker/status`.
    - [x] Test `POST /api/docker/start` and `stop`. Ensure these work regardless of mode (or restrict if necessary).

## Phase 3: Functional Testing (End-to-End)

**Objective:** Validate the user workflows in each environment.

### 3.1 Simulation Workflow
- [x] **Start Simulation:** Click "Start New Simulation".
- [x] **Monitor:** Watch logs appear in the "Simulation Control" tab.
- [x] **Verify Output:** Wait for "Product Created" log, then check "Winning Products" tab to see the new item.
- [x] **Chat:** Ask the CEO "What is the current status?" and verify context awareness.
- [x] **Reset:** Click "Clear Sim DB" and verify data disappears from "Winning Products".

### 3.2 Live Workflow
- [x] **Launch:** Start server in Live mode (`npm start`).
- [x] **Navigation:** Confirm "Run Simulation" is absent.
- [x] **Data View:** Check "Winning Products". It should show persistent production data (if any).
- [x] **Chat:** Ask the CEO "How are sales today?" (Live CEO should query the live DB/Stripe).

## Phase 4: Code Quality & Cleanup

**Objective:** Final polish and error handling.

- [ ] **Error Handling:** Ensure UI handles API failures gracefully (e.g., if Docker is down).
- [ ] **Console Cleanup:** Remove excessive `console.log` debugging from client-side JS.
- [ ] **Hardcoded Values:** Scan `admin.html` and `sidebar.js` for any hardcoded strings that imply a specific mode.
- [ ] **CSS Polish:** Ensure the "Hidden" class (`display: none`) works correctly without layout shift.
