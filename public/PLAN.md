# Control Panel Integration & Verification Plan

This plan outlines the steps to verify and refine the integration between the DS1 Control Panel (`admin.html`) and the backend system, ensuring strict separation between Simulation and Live modes.

## Phase 1: UI/UX & Conditional Rendering (Frontend)

**Objective:** Ensure the interface adapts dynamically to the server mode (`simulation` vs `live`).

- [ ] **Sidebar Logic Verification**
    - [ ] Verify `sidebar.js` fetches `/api/config` on load.
    - [ ] **Simulation Mode:** Confirm "Run Simulation" and "Staging Review" links are **visible**.
    - [ ] **Live Mode:** Confirm "Run Simulation" and "Staging Review" links are **hidden**.
    - [ ] Verify "Business" (Products, Orders, Ads) and "System" (Activity, Infra) links are visible in **both** modes.

- [ ] **Tab Visibility & Protection**
    - [ ] **Simulation Tab:** Ensure `#simulation` div is hidden by default in HTML.
    - [ ] **Direct Access Check:** If a user navigates to `#simulation` while in Live mode, redirect them to `#products` or show an "Access Denied" message.
    - [ ] **Default Landing:**
        - [ ] Sim Mode: Defaults to `#simulation`.
        - [ ] Live Mode: Defaults to `#products`.

- [ ] **Visual Indicators**
    - [ ] Verify the Sidebar Header displays the correct badge ("SIMULATION MODE" vs "LIVE MODE").
    - [ ] Verify the CEO Chat status badge reflects the correct agent mode.

## Phase 2: API Integration & Data Flow (Backend Connection)

**Objective:** Ensure UI controls trigger the correct backend services and display the correct data sources.

- [ ] **Simulation Endpoints (Sim Mode Only)**
    - [ ] **Start:** Test `POST /api/simulation/start`. Verify it triggers `SimulationService.runSimulationFlow()`.
    - [ ] **Clear:** Test `POST /api/simulation/clear`. Verify it wipes the `dropship_sim` database.
    - [ ] **Logs:** Test `GET /api/logs`. Verify it returns logs from the `activity_log` table (Sim DB).

- [ ] **Business Data Endpoints (Dual Mode)**
    - [ ] **Products:** Test `GET /api/products`. Ensure it queries the correct DB (`dropship_sim` vs `dropship`) based on the active container configuration.
    - [ ] **Orders:** Test `GET /api/orders`. Verify correct DB source.
    - [ ] **Ads:** Test `GET /api/ads`. Verify correct DB source.

- [ ] **CEO Chat Integration**
    - [ ] Test `POST /api/ceo/chat`.
    - [ ] **Sim Mode:** Verify it talks to the Mock/Sim CEO Agent.
    - [ ] **Live Mode:** Verify it talks to the Real CEO Agent (Azure OpenAI).

- [ ] **Infrastructure Control**
    - [ ] Test `GET /api/docker/status`.
    - [ ] Test `POST /api/docker/start` and `stop`. Ensure these work regardless of mode (or restrict if necessary).

## Phase 3: Functional Testing (End-to-End)

**Objective:** Validate the user workflows in each environment.

### 3.1 Simulation Workflow
- [ ] **Start Simulation:** Click "Start New Simulation".
- [ ] **Monitor:** Watch logs appear in the "Simulation Control" tab.
- [ ] **Verify Output:** Wait for "Product Created" log, then check "Winning Products" tab to see the new item.
- [ ] **Chat:** Ask the CEO "What is the current status?" and verify context awareness.
- [ ] **Reset:** Click "Clear Sim DB" and verify data disappears from "Winning Products".

### 3.2 Live Workflow
- [ ] **Launch:** Start server in Live mode (`npm start`).
- [ ] **Navigation:** Confirm "Run Simulation" is absent.
- [ ] **Data View:** Check "Winning Products". It should show persistent production data (if any).
- [ ] **Chat:** Ask the CEO "How are sales today?" (Live CEO should query the live DB/Stripe).

## Phase 4: Code Quality & Cleanup

**Objective:** Final polish and error handling.

- [ ] **Error Handling:** Ensure UI handles API failures gracefully (e.g., if Docker is down).
- [ ] **Console Cleanup:** Remove excessive `console.log` debugging from client-side JS.
- [ ] **Hardcoded Values:** Scan `admin.html` and `sidebar.js` for any hardcoded strings that imply a specific mode.
- [ ] **CSS Polish:** Ensure the "Hidden" class (`display: none`) works correctly without layout shift.
