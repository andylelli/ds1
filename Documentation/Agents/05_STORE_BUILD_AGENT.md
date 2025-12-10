# 🏪 05. Store Build Agent (The Architect)

## 1. Executive Summary
The **Store Build Agent** is the "Architect" responsible for creating the customer-facing sales assets. It takes an approved product and supplier, then builds a high-converting product page on the e-commerce platform (Shopify).

## 2. Core Responsibilities
*   **Product Page Creation**: Uploads images, writes descriptions, and sets prices on Shopify.
*   **Copywriting**: Uses AI to generate persuasive product descriptions if none exist.
*   **Pricing Strategy**: Applies a markup (default 1.5x) to the COGS to determine the retail price.
*   **SEO Optimization**: (Planned) Optimizes page titles and meta tags for search engines.

## 3. Event Interface

### Subscribes To
| Event | Source | Action |
| :--- | :--- | :--- |
| `SUPPLIER_APPROVED` | CEO Agent | Triggers the creation of the product page. |

### Publishes
| Event | Payload | Description |
| :--- | :--- | :--- |
| `PRODUCT_PAGE_CREATED` | `{ product, pageUrl }` | Emitted when the page is live and ready for traffic. |

## 4. Toolbox (MCP)

| Tool Name | Description | Parameters |
| :--- | :--- | :--- |
| `create_product_page` | Creates a product on Shopify. | `product_data` (object) |
| `optimize_seo` | Optimizes page metadata. | `product_id` (string) |

## 5. Key Logic & Decision Making

### Content Generation
If the product data lacks a description, the agent automatically calls an internal helper (using AI) to generate one based on the product name.

### Pricing Logic
$$ \text{Retail Price} = \text{Supplier Price} \times 1.5 $$
*   *Note:* This is a simple default. Future versions will use dynamic pricing based on competitor analysis.

## 6. Current Status
*   **Implementation**: Mock / Partial Real.
*   **Logic**: The `StoreBuildAgent` class is implemented.
*   **Adapters**:
    *   `MockShopAdapter`: Simulates Shopify API calls, returning a fake URL.
    *   `ShopifyAdapter`: (Exist but requires API keys) Can connect to a real store.
