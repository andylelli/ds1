# 📦 04. Supplier Agent (The Sourcing Manager)

## 1. Executive Summary
The **Supplier Agent** acts as the "Sourcing Manager". Once a product is approved by the CEO, this agent's job is to find a reliable supplier who can fulfill the order at a profitable price point.

## 2. Core Responsibilities
*   **Supplier Discovery**: Searches platforms (AliExpress, CJ Dropshipping) for vendors selling the approved product.
*   **Cost Analysis**: Calculates the Cost of Goods Sold (COGS) and shipping fees.
*   **Vetting**: Checks supplier ratings and shipping times to ensure quality.
*   **Negotiation**: (Planned) Automatically negotiates for better pricing on bulk orders.

## 3. Event Interface

### Subscribes To
| Event | Source | Action |
| :--- | :--- | :--- |
| `PRODUCT_APPROVED` | CEO Agent | Triggers the search for suppliers for the approved product. |

### Publishes
| Event | Payload | Description |
| :--- | :--- | :--- |
| `SUPPLIER_FOUND` | `{ product, supplier }` | Emitted when a viable supplier is identified. |

## 4. Toolbox (MCP)

| Tool Name | Description | Parameters |
| :--- | :--- | :--- |
| `find_suppliers` | Searches for suppliers for a product ID. | `product_id` (string) |
| `negotiate_price` | Simulates price negotiation. | `supplier_id` (string), `target_price` (number) |

## 5. Key Logic & Decision Making

### Supplier Selection Criteria
The agent filters suppliers based on:
1.  **Rating**: Must be > 4.5 stars.
2.  **Shipping Time**: Must be < 20 days (ePacket/Standard).
3.  **Price**: Must allow for a healthy margin (checked by CEO later).

### Workflow Integration
The agent emits `SUPPLIER_FOUND` for the best match. The CEO then reviews this specific supplier choice before giving the green light to build the store.

## 6. Current Status
*   **Implementation**: Mock.
*   **Logic**: The `SupplierAgent` class is implemented.
*   **Adapters**:
    *   `MockFulfilmentAdapter`: Returns simulated supplier data (e.g., "AliExpress Vendor A").
