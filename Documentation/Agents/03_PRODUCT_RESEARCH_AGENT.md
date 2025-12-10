# 🕵️ 03. Product Research Agent (The Hunter)

## 1. Executive Summary
The **Product Research Agent** is the "Hunter" of the swarm. Its sole purpose is to scan the market, identify trending niches, and surface high-potential products that meet specific criteria (e.g., high demand, low competition).

## 2. Core Responsibilities
*   **Trend Analysis**: Scans social media and search trends to find rising keywords.
*   **Competitor Analysis**: Checks market saturation by analyzing competitor ads and listings.
*   **Niche Selection**: Evaluates specific categories (e.g., "Pet Supplies") for profitability.
*   **Product Discovery**: Outputs a list of "Winning Product Candidates" for the CEO to review.

## 3. Event Interface

### Subscribes To
| Event | Source | Action |
| :--- | :--- | :--- |
| `COMMAND_START` | CEO Agent | Triggers a new research cycle for a specific category. |
| `RESEARCH_REQUESTED` | System | (Legacy) Alternative trigger for research. |

### Publishes
| Event | Payload | Description |
| :--- | :--- | :--- |
| `PRODUCT_FOUND` | `{ product }` | Emitted for each product that passes the initial filter. |

## 4. Toolbox (MCP)

| Tool Name | Description | Parameters |
| :--- | :--- | :--- |
| `find_winning_products` | Searches for products in a category. | `category` (string), `criteria` (object) |
| `analyze_niche` | Deep dive into a specific niche. | `niche` (string) |
| `analyze_competitors` | Checks competition levels. | `category` (string) |

## 5. Key Logic & Decision Making

### The "Winning Product" Filter
The agent uses the `TrendAnalysisPort` to score products. A product is considered "Found" if:
1.  **Trend Score**: > 70 (indicating rising popularity).
2.  **Competition Score**: < 50 (indicating it's not yet saturated).

### Workflow Integration
Currently, the agent iterates through found products and emits `PRODUCT_FOUND` for *each* one, allowing the CEO to review them individually rather than as a batch.

## 6. Current Status
*   **Implementation**: Mock / Partial Real.
*   **Logic**: The `ProductResearchAgent` class is fully implemented.
*   **Adapters**:
    *   `MockTrendAdapter`: Returns hardcoded "winning" products for testing.
    *   `MockCompetitorAdapter`: Returns simulated saturation data.
