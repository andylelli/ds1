# 📣 06. Marketing Agent (The Promoter)

## 1. Executive Summary
The **Marketing Agent** is the "Promoter" of the swarm. Once a product page is live, this agent takes over to drive traffic. It manages ad campaigns, writes ad copy, and allocates budget across platforms (Meta, TikTok).

## 2. Core Responsibilities
*   **Campaign Creation**: Sets up new ad campaigns on ad platforms.
*   **Ad Copywriting**: Generates headlines and body text for ads.
*   **Budget Management**: Sets initial budgets (default $500) and adjusts them based on instructions.
*   **Platform Selection**: Currently defaults to Facebook, but designed to support multiple channels.

## 3. Event Interface

### Subscribes To
| Event | Source | Action |
| :--- | :--- | :--- |
| `PRODUCT_PAGE_CREATED` | Store Build Agent | Triggers the creation of an ad campaign for the new page. |

### Publishes
| Event | Payload | Description |
| :--- | :--- | :--- |
| `CAMPAIGN_STARTED` | `{ campaign, product }` | Emitted when the ads are live. Signals the end of the "Growth" workflow. |

## 4. Toolbox (MCP)

| Tool Name | Description | Parameters |
| :--- | :--- | :--- |
| `create_ad_campaign` | Launches a campaign. | `platform`, `budget`, `product` |
| `write_copy` | Generates ad text. | `type` (string), `topic` (string) |

## 5. Key Logic & Decision Making

### Campaign Setup
The agent initializes campaigns in a "Draft" or "Active" state depending on configuration.
*   **Default Budget**: $500 (Simulated).
*   **Targeting**: Currently generic; future versions will use `ProductResearch` data to refine targeting.

### Copywriting
Uses a template-based approach (or AI) to generate "Click-Bait" style headlines:
*   *Example:* "Discover the Amazing [Product Name]. Buy now!"

## 6. Current Status
*   **Implementation**: Mock.
*   **Logic**: The `MarketingAgent` class is implemented.
*   **Adapters**:
    *   `MockAdsAdapter`: Simulates the Meta Ads API, returning a fake Campaign ID.
