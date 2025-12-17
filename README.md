# DropShip AI Agent Swarm (DS1)

hale-treat-109915-fb095f60b831.json

An autonomous multi-agent system designed to simulate and execute dropshipping business operations.

## 📚 Documentation

The project documentation is organized into **PMO** (Project Management Office), **Blueprints** (Architecture), and **Reference** (Guides & Context) folders.

### 🟢 PMO Documents (Project Management Office)
*   [**Project Status & Roadmap**](Documentation/PMO/PROJECT_STATUS.md) - The master tracker of what is built vs. pending.
*   [**Things To Do**](Documentation/PMO/THINGS_TO_DO.md) - Granular task checklist.
*   [**RAID Log**](Documentation/PMO/RAID_LOG.md) - Risks, Assumptions, Issues, and Dependencies.
*   [**Technical Debt**](Documentation/PMO/TECHNICAL_DEBT.md) - Architectural shortcuts and refactoring plans.

### 🔄 Workflow Documentation (The Core Logic)
*   [**00. System Overview**](Documentation/Workflows/00_OVERVIEW.md) - How the three engines connect.
*   [**01. Growth Engine**](Documentation/Workflows/01_GROWTH.md) - Product Research, Sourcing, & Marketing.
*   [**02. Operations Engine**](Documentation/Workflows/02_OPERATIONS.md) - Fulfillment, Shipping, & Customer Service.
*   [**03. Optimization Engine**](Documentation/Workflows/03_OPTIMIZATION.md) - Analytics, Reporting, & Strategy.

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

2.  **Build TypeScript**:
    ```bash
    npm run build
    ```

3.  **Start Control Panel** (Recommended):
    - **Windows**: Double-click `run_control_panel.bat`
    - **Manual**: 
      ```bash
      npm start
      ```
    Visit `http://localhost:3000`

4.  **Database Setup** (Optional):
    - Start PostgreSQL via Docker:
      ```bash
      docker-compose up -d
      ```
    - Or use the Database Inspector in the Control Panel to start/stop the database

## 🏗️ Architecture
The system uses a swarm of specialized agents (CEO, Marketing, Operations, etc.) orchestrated by a central simulation loop.
- **Test Mode**: Uses PostgreSQL simulator database (Recommended for development).
- **Mock Mode**: Uses local JSON file storage (Lightweight testing).
- **Live Mode**: Connects to production database and real APIs (Requires configuration).
