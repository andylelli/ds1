# DropShip AI Agent Swarm (DS1)

An autonomous multi-agent system designed to simulate and execute dropshipping business operations.

## 📚 Documentation

The project documentation is organized into **Live** (Active Management) and **Reference** (Guides & Context) folders.

### 🟢 Live Documents (Active Project Management)
*   [**Project Status & Roadmap**](Documentation/Live/PROJECT_STATUS.md) - The master tracker of what is built vs. pending.
*   [**Things To Do**](Documentation/Live/THINGS_TO_DO.md) - Granular task checklist.
*   [**RAID Log**](Documentation/Live/RAID_LOG.md) - Risks, Assumptions, Issues, and Dependencies.
*   [**Technical Debt**](Documentation/Live/TECHNICAL_DEBT.md) - Architectural shortcuts and refactoring plans.

### 📘 Reference Documents (Guides & Context)
*   [**Dummies Guide**](Documentation/Reference/DUMMIES_GUIDE.md) - Simple explanation of the project.
*   [**Deployment Guide**](Documentation/Reference/DEPLOYMENT_GUIDE.md) - How to deploy to production.
*   [**Investor Overview**](Documentation/Reference/INVESTOR_OVERVIEW.md) - Business pitch and vision.
*   [**User Stories**](Documentation/Reference/USER_STORIES.md) - Functional requirements.
*   [**Future Enhancements**](Documentation/Reference/FUTURE_ENHANCEMENTS.md) - Wishlist for V2.
*   [**MCP Explained**](Documentation/Reference/MCP_EXPLAINED.md) - Details on the Model Context Protocol used.

## 🚀 Quick Start

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Simulation (CLI)**:
    ```bash
    node src/run_simulation_cli.js
    ```

3.  **Start Web Admin Panel**:
    ```bash
    node src/index.js
    ```
    Visit `http://localhost:3000/admin.html`

## 🏗️ Architecture
The system uses a swarm of specialized agents (CEO, Marketing, Operations, etc.) orchestrated by a central simulation loop.
- **Mock Mode**: Uses simulated APIs and local JSON DB (Default).
- **Live Mode**: Connects to real Shopify/Meta APIs (Requires Config).
