# How to Play: DropShip v1.0

## Objective
The goal of the DropShip system is to autonomously identify profitable products, source them, build a store, market them, and fulfill orders. As the "player" (or operator), your role is to supervise the AI agents, provide high-level strategic direction, and monitor performance.

## Game Modes

### 1. Simulation Mode (Default)
*   **Environment**: Uses a local PostgreSQL database (`dropship_sim`).
*   **Time**: Accelerated (1 tick = 2 hours).
*   **Money**: Virtual currency.
*   **Agents**: Mocked responses or local LLM (if configured).
*   **Goal**: Test strategies and agent interactions without spending real money.

### 2. Live Mode
*   **Environment**: Uses the production PostgreSQL database (`dropship`).
*   **Time**: Real-time.
*   **Money**: Real budget (Stripe/Shopify integration).
*   **Agents**: Live Azure OpenAI GPT-4 models.
*   **Goal**: Generate actual revenue.

---

## Controls Reference (Control Panel)

The Control Panel (`http://localhost:3000/admin.html`) is your command center.

### Simulation Tab
*   **Product Input**: A text field to give the CEO Agent a starting direction (e.g., "Eco-friendly dog toys").
*   **Start**: Initiates the research phase based on your input and starts the simulation clock.
*   **Pause**: Temporarily halts the simulation clock (ticks). Agents pause their current tasks.
*   **Resume**: Restarts the clock from where it left off.
*   **Stop**: Completely stops the simulation loop.
*   **Clear Sim DB**: Wipes all data from the simulation database (products, orders, logs) to start fresh.
*   **Clear Logs**: Clears the log viewer window (does not delete data).
*   **Show History**: Reloads all past logs from the database.

### CEO Chat Tab
*   **Chat Interface**: Direct messaging with the CEO Agent. Use this to ask for status updates, change strategy, or debug agent reasoning.
*   **Mode Badge**: Indicates if the CEO is running in "Mock" or "Live" mode.

### Monitoring Tabs
*   **Winning Products**: Displays products that have passed the research and sourcing phases.
*   **Order History**: Shows all customer orders and their fulfillment status.
*   **Ad Campaigns**: Tracks active marketing campaigns and their budget usage.
*   **Database Inspector**: A raw view of the PostgreSQL tables (Events, Products, Orders) for debugging.

---

## Step-by-Step Walkthrough (Simulation)

### 1. Start the System
Ensure the Docker containers are running and the web server is up.
```bash
npm run start:sim
```
Open `http://localhost:3000/admin.html` in your browser.

### 2. Initialize a Run
1.  Navigate to the **Simulation** tab.
2.  (Optional) Click **Clear Sim DB** to ensure a clean slate.
3.  In the **Product Input** field, type a niche or product idea (e.g., "Smart kitchen gadgets").
4.  Click **Start**.

### 3. Watch the Agents Work
The **System Logs** viewer will light up with activity:
*   **CEO Agent**: Receives your input and delegates to Research.
*   **Research Agent**: Scrapes trends (simulated) and identifies a product.
*   **Supplier Agent**: Negotiates prices and margin.
*   **Store Agent**: "Builds" the product page.
*   **Marketing Agent**: Launches ad campaigns.
*   **Customer Agent**: Simulates traffic and purchases.

### 4. Intervene
*   **Pause** the simulation if you want to read the logs in detail.
*   Switch to the **CEO Chat** tab to ask: "What is the current profit margin for the kitchen gadget?"
*   Switch to the **Database Inspector** to see the raw `ProductSelected` events.

### 5. Analyze Results
*   Check the **Winning Products** tab to see the final specs of the chosen item.
*   Check **Order History** to see if the simulated customers are buying.

---

## Troubleshooting

### Simulation Won't Start
*   **Check Docker**: Ensure the `postgres` container is running. Use the **Database Inspector** tab to check the status indicator.
*   **Check Logs**: Look at the VS Code terminal where you ran `npm run start:sim` for server-side errors.

### Agents Are Silent
*   Ensure you clicked **Start** (not just typed in the box).
*   Check if the simulation is **Paused** (Status tag will be yellow).

### "Access Denied"
*   If you try to access Simulation controls while in Live Mode, the system will block you. Go to **System Settings** and switch Database Mode to "Test".
