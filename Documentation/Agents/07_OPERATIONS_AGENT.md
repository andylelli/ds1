# 🚚 07. Operations Agent (The Logistics Manager)

## 1. Executive Summary
The **Operations Agent** is the "Logistics Manager" responsible for the physical fulfillment of orders. Once a customer places an order, this agent ensures the product is purchased from the supplier and shipped to the customer's address.

## 2. Core Responsibilities
*   **Order Fulfillment**: Automatically places orders with the supplier (AliExpress/CJ) using the customer's shipping details.
*   **Inventory Checking**: Verifies stock levels before processing orders.
*   **Shipping Management**: Handles shipping issues (e.g., lost packages) and generates replacement orders if necessary.
*   **Dual-Mode Operation**: Can switch between "Simulation" (mock fulfillment) and "Real" (API calls) modes based on configuration.

## 3. Event Interface

### Subscribes To
| Event | Source | Action |
| :--- | :--- | :--- |
| `ORDER_RECEIVED` | Shopify Webhook / System | Triggers the fulfillment process for the new order. |

### Publishes
| Event | Payload | Description |
| :--- | :--- | :--- |
| `ORDER_SHIPPED` | `{ order, tracking }` | Emitted when the supplier confirms shipment. Triggers customer notification. |

## 4. Toolbox (MCP)

| Tool Name | Description | Parameters |
| :--- | :--- | :--- |
| `fulfill_order` | Places order with supplier. | `order_id` (string) |
| `check_inventory` | Checks stock for a SKU. | `sku` (string) |
| `handle_shipping_issue` | Resolves delivery problems. | `order_id`, `issue_type` |

## 5. Key Logic & Decision Making

### Fulfillment Routing
The agent checks the global configuration (`useSimulatedEndpoints`) to decide how to fulfill the order:
*   **Simulation Mode**: Generates a fake tracking number (`TRK...`) and marks the order as shipped instantly.
*   **Real Mode**: (Planned) Calls the Supplier API to place a real dropshipping order.

### Issue Resolution
If a shipping issue is reported, the agent has logic to automatically authorize a "Reship" action, generating a replacement tracking number.

## 6. Current Status
*   **Implementation**: Partial Real / Partial Mock.
*   **Logic**: The `OperationsAgent` class is implemented with dual-mode support.
*   **Adapters**:
    *   Uses internal logic to mock fulfillment in the current phase.
