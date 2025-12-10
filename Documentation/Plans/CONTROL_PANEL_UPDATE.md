# Control Panel Update Plan & Verification

## 1. Updates Implemented

### Unified Control Panel
*   **Single Entry Point:** `admin.html` serves as the control panel for both Simulation and Live modes.
*   **Dynamic Sidebar:** `sidebar.js` now fetches the server configuration (`/api/config`) to determine the current mode (`simulation` or `live`) and renders the appropriate navigation links.

### Conditional Rendering
*   **Simulation Mode:**
    *   Sidebar displays "SIMULATION MODE" badge.
    *   "Simulation" section (Run Simulation, Staging Review) is visible.
    *   Default landing tab is "Run Simulation".
*   **Live Mode:**
    *   Sidebar displays "LIVE MODE" badge.
    *   "Simulation" section is hidden.
    *   Default landing tab is "Winning Products".

### Single "Chat with CEO"
*   **Consolidation:** Removed the duplicate chat interface from the "Run Simulation" tab.
*   **Dedicated Tab:** The "Chat with CEO" feature now lives exclusively in its own tab (`#ceo-chat`), accessible from the sidebar in both modes.

## 2. Verification Checks

To ensure the control panel works correctly after these changes, perform the following checks:

### Check 1: Simulation Mode
1.  **Start Server:** Run `npm run sim` (or ensure `DS1_MODE=simulation`).
2.  **Open Browser:** Navigate to `http://localhost:3000`.
3.  **Verify Sidebar:**
    *   Badge says "SIMULATION MODE".
    *   "Simulation" section is visible.
4.  **Verify Tabs:**
    *   Click "Run Simulation". Ensure you see the "Start New Simulation" button and the Logs viewer (full width).
    *   Click "Chat with CEO". Ensure the chat interface loads and you can send a message.
5.  **Verify Functionality:**
    *   Click "Start New Simulation". Check if logs start appearing in the log viewer.

### Check 2: Live Mode
1.  **Start Server:** Run `npm start` (ensure `DS1_MODE=live`).
2.  **Open Browser:** Navigate to `http://localhost:3000`.
3.  **Verify Sidebar:**
    *   Badge says "LIVE MODE".
    *   "Simulation" section is **NOT** visible.
4.  **Verify Tabs:**
    *   You should land on "Winning Products" (or another business tab), not "Run Simulation".
    *   "Chat with CEO" should still be available.
5.  **Verify Functionality:**
    *   Check "Products", "Orders", "Ads" tabs to ensure they fetch data (even if empty).

### Check 3: API Endpoints
*   **Config:** Visit `http://localhost:3000/api/config`. Ensure it returns a JSON object with `"mode": "simulation"` or `"mode": "live"`.
*   **Chat:** Ensure `/api/ceo/chat` responds correctly in both modes.

## 3. Code Changes Summary
*   **`src/index.ts`**: Updated `/api/config` to include the `mode` property.
*   **`public/sidebar.js`**: Rewritten to fetch config and render dynamic HTML.
*   **`public/admin.html`**:
    *   Removed duplicate chat from `#simulation`.
    *   Updated layout of `#simulation`.
    *   Updated `loadConfig` to handle mode-based tab switching.
    *   Removed redundant simulation-specific chat JS logic.
