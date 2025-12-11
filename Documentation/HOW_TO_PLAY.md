# 🎮 How to Play: DS1 Dropshipping Simulator

## 🎯 Objective
Run a profitable dropshipping business by finding winning products, managing ad campaigns, and keeping inventory in stock. The AI agents handle the heavy lifting, but YOU make the strategic decisions.

## 🚀 Getting Started
1.  **Open the Admin Panel**: Navigate to `http://localhost:3000/admin.html`.
2.  **Check Status**: Ensure the Database status is "Running".

## 🔄 The Core Loop

### Phase 1: Product Research 🕵️‍♂️
1.  Go to the **Simulation** tab.
2.  Click **"Start New Simulation"**.
3.  **What happens?** The Research Agent scans the market for trending products in the "Fitness" niche (default).
4.  **Result**: The simulation pauses. The product is sent to **Staging**.

### Phase 2: The Approval Gate 🚦
1.  Go to the **Staging** tab.
2.  Review the candidate products.
    *   **Confidence Score**: How likely is this to sell?
    *   **Source**: Where did the agent find it?
3.  **Action**:
    *   ✅ **Approve**: Launches the product. The agents will source it, build a store page, and create ad campaigns.
    *   ❌ **Reject**: Discards the product.

### Phase 3: Live Operations 📈
1.  Return to the **Simulation** tab.
2.  Click **"Start Loop"**.
3.  **The Engine Starts**: Time begins to flow (1 tick ≈ 1 hour).
4.  **Watch the Logs**:
    *   **Traffic**: Visitors arrive based on your ad spend.
    *   **Orders**: Sales start coming in!
    *   **Inventory**: Stock levels drop with every sale.

## 🧩 Game Mechanics

### 📦 Inventory & Supply Chain
*   **Starting Stock**: New products launch with **50 units**.
*   **Stockouts**: If inventory hits 0, you lose sales!
*   **Auto-Restock**: When stock drops below **10 units**, the Supplier Agent automatically orders **50 more**.
*   **Shipping Delay**: Restocks take **5 ticks** to arrive. Pray you don't run out before then!

### 🌪️ Market Events
Random events occur that change the game rules:
*   **Viral Trend**: Traffic spikes! 🚀
*   **Competitor Price War**: Conversion rates drop. 📉
*   **Ad Algo Update**: Ads get more expensive. 💸
*   *Events last for 10 ticks.*

### 🤖 AI Optimization
Every ~1 minute (12 ticks), the **Analytics Agent** runs a profit report.
*   **The Terminator Protocol**: If a campaign is losing money (Profit < -$50), the agent will **automatically kill the campaign** to save your budget.

## 🕹️ Controls Reference

| Button | Function |
| :--- | :--- |
| **Start New Simulation** | Runs Research Phase only. Finds a candidate product. |
| **Start Loop** | Starts the continuous time engine (Traffic, Sales, Events). |
| **Stop Loop** | Pauses time. |
| **Clear Sim DB** | ⚠️ **Resets everything**. Deletes all products, orders, and logs. |
| **Clear Logs** | Clears the text display (does not delete data). |

## 🏆 Winning Strategy
*   **Don't approve everything**: Only launch high-confidence products.
*   **Monitor Inventory**: If you're selling too fast, you might stock out before the auto-restock arrives.
*   **Watch the Profit**: Use the logs to see if your campaigns are ROI positive.

---
*Good luck, CEO!*
