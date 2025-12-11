# Control Panel QA & Verification Plan

This document outlines a comprehensive Quality Assurance (QA) plan to verify the functionality, stability, and user experience of the DS1 Control Panel across both **Simulation** and **Live** modes.

## 🎯 Objectives
- Ensure strict isolation between Simulation and Live environments.
- Verify all UI controls (buttons, forms, navigation) function as intended.
- Confirm data visualization accurately reflects the underlying database state.
- Validate integration with external services (OpenAI) in Live mode.
- Test error handling and system resilience.

---

## 🛠️ Prerequisites
- **Docker Desktop** running.
- **Node.js** environment set up.
- `.env` file configured with valid `AZURE_OPENAI_*` credentials.
- Database container (`ds1-db-1`) running.

---

## 🧪 Part 1: Simulation Mode Verification

**Startup Command:** `$env:DS1_MODE='simulation'; npx tsx src/index.ts`

### 1.1 Sidebar & Navigation
- [ ] **Visibility:** Verify "Simulation" section (Run Simulation, Staging Review) is **VISIBLE**.
- [ ] **Header:** Verify "DS1 Control" header shows "SIMULATION MODE" (usually with opacity/subtitle).
- [ ] **Links:** Click every link. Ensure the main content area updates without a full page reload (SPA feel) or navigates correctly.
- [ ] **Active State:** Verify the clicked link is highlighted in the sidebar.

### 1.2 Simulation Control Tab (`#simulation`)
- [ ] **Default View:** Should be the landing page in Sim mode.
- [ ] **"Start New Simulation" Button:**
    - [ ] Click button.
    - [ ] **Expected:** Success toast message ("Simulation started").
    - [ ] **Logs:** "Simulation Logs" viewer should start populating with events (e.g., "Flow Started", "Finding products").
- [ ] **"Clear Sim DB" Button:**
    - [ ] Click button.
    - [ ] **Expected:** Confirmation dialog -> Success toast.
    - [ ] **Verification:** Go to "Products" tab; it should be empty.
- [ ] **"Clear Logs" Button:**
    - [ ] Click button.
    - [ ] **Expected:** Log viewer clears immediately.
- [ ] **"Show History" Button:**
    - [ ] Click button.
    - [ ] **Expected:** Log viewer repopulates with past logs from the DB.

### 1.3 Business Data Tabs (Products, Orders, Ads)
- [ ] **Products Tab:**
    - [ ] **Refresh Button:** Click after running a simulation.
    - [ ] **Data:** Verify new products appear with Name, Potential (Badge), Margin, and Timestamp.
- [ ] **Orders Tab:**
    - [ ] **Refresh Button:** Click.
    - [ ] **Data:** Verify orders appear (if simulation generated sales). Check Status badges (Shipped vs Pending).
- [ ] **Ads Tab:**
    - [ ] **Refresh Button:** Click.
    - [ ] **Data:** Verify campaigns appear. Check Budget and Status.

### 1.4 CEO Chat (Sim Context)
- [ ] **Badge:** Verify badge says "CEO: Mock (Simulated)" (Orange/Yellow).
- [ ] **Interaction:**
    - [ ] Type "Status check". Press Enter or Click Send.
    - [ ] **UI:** User message appears. "Thinking..." bubble appears.
    - [ ] **Response:** CEO Agent responds with **Mock** data (e.g., "All agents operational", "3 products in pipeline").
    - [ ] **Latency:** Response should be near-instant.

### 1.5 System Tabs
- [ ] **Database Inspector:**
    - [ ] **Docker Controls:** Click "Stop" (wait for red status), then "Start" (wait for green status).
    - [ ] **Source Selector:** Select "Simulator Database".
    - [ ] **Table Selector:** Browse "Events", "Products". Verify data matches Business tabs.
- [ ] **Settings:**
    - [ ] Change "Log Level" to "Debug".
    - [ ] Click "Save". Verify success toast.
    - [ ] Reload page. Verify setting persists (if backend persistence is implemented) or resets to default (if not).

---

## 🚀 Part 2: Live Mode Verification

**Startup Command:** `$env:DS1_MODE='live'; npx tsx src/index.ts`

### 2.1 Sidebar & Navigation
- [ ] **Visibility:** Verify "Simulation" section is **HIDDEN**.
- [ ] **Header:** Verify header shows "LIVE MODE".
- [ ] **Access Control:** Try manually navigating to `http://localhost:3000/admin.html#simulation`.
    - [ ] **Expected:** Redirect to `#products` OR "Access Denied" warning in console/UI.

### 2.2 Business Data Tabs
- [ ] **Data Source:** Verify data shown is from the **Live** database pool (should be distinct from Sim data).
- [ ] **Refresh:** Verify buttons work and fetch live data.

### 2.3 CEO Chat (Live Context)
- [ ] **Badge:** Verify badge says "CEO: Live (Azure OpenAI)" (Green).
- [ ] **Interaction:**
    - [ ] Type "Analyze current market trends".
    - [ ] **UI:** "Thinking..." bubble appears.
    - [ ] **Response:** CEO Agent responds using **Azure OpenAI**. Response should be more natural/intelligent than Mock.
    - [ ] **Latency:** Response will take longer (1-5s) than Sim mode.

### 2.4 Database Inspector
- [ ] **Source Selector:** Select "Live Database".
- [ ] **Verification:** Ensure it pulls from the production tables.

---

## 🛡️ Part 3: Error Handling & Resilience

### 3.1 Database Disconnection
- [ ] **Action:** Manually stop the Docker container (`docker stop ds1-db-1`) while the app is running.
- [ ] **Test:** Click "Refresh" on Products tab.
- [ ] **Expected:** UI shows a red error message ("Connection refused" or "Failed to fetch"). App should not crash.

### 3.2 API Failures
- [ ] **Action:** Stop the Node.js server.
- [ ] **Test:** Click any navigation link or button.
- [ ] **Expected:** UI handles the fetch failure gracefully (e.g., "Network error").

### 3.3 Invalid Input
- [ ] **CEO Chat:** Try sending an empty message.
    - [ ] **Expected:** Nothing happens, or UI validation prevents sending.

---

## 📝 Execution Log

| Date | Mode | Tester | Status | Notes |
|------|------|--------|--------|-------|
|      | Sim  |        |        |       |
|      | Live |        |        |       |
