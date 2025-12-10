# 🧠 02. Analytics Agent (The Analyst)

## 1. Executive Summary
The **Analytics Agent** acts as the "Brain" of the operation, responsible for **Data Aggregation**, **Reporting**, and **Forecasting**. It continuously monitors the financial health of the business, calculating key metrics like Profit, Revenue, and ROAS (Return on Ad Spend) to guide strategic decisions.

## 2. Core Responsibilities
*   **Data Aggregation**: Collects data from Sales (Shopify), Costs (Supplier), and Spend (Ads) to create a unified view of the business.
*   **Reporting**: Generates daily, weekly, and monthly performance reports for the CEO and User.
*   **Forecasting**: Uses historical data to predict future sales trends and inventory needs.
*   **Alerting**: Monitors for critical anomalies (e.g., sudden drop in sales, spike in ad costs) and alerts the CEO.

## 3. Event Interface

### Subscribes To
| Event | Source | Action |
| :--- | :--- | :--- |
| `DAILY_REPORT_REQUESTED` | Cron / System | Triggers the generation of a daily performance snapshot. |
| `ORDER_SHIPPED` | Operations Agent | (Optional) Updates real-time stats when an order is fulfilled. |

### Publishes
| Event | Payload | Description |
| :--- | :--- | :--- |
| `REPORT_GENERATED` | `{ period, stats }` | Contains the calculated metrics (Revenue, Profit, etc.). |
| `ALERT_CRITICAL` | `{ type, metric }` | (Planned) Emitted when metrics fall below safety thresholds. |

## 4. Toolbox (MCP)

| Tool Name | Description | Parameters |
| :--- | :--- | :--- |
| `generate_report` | Aggregates data into a financial report. | `period` (string: 'daily', 'weekly') |
| `predict_sales` | Forecasts future sales for a product. | `product` (string) |

## 5. Key Logic & Decision Making

### Profit Calculation
The agent calculates Net Profit using the formula:
$$ \text{Net Profit} = \text{Total Revenue} - (\text{COGS} + \text{Shipping Costs} + \text{Ad Spend} + \text{Transaction Fees}) $$

### Forecasting Model
*   **Current**: Uses a simple linear projection based on the last 7 days of data.
*   **Future**: Will implement more advanced regression models to account for seasonality and ad fatigue.

## 6. Current Status
*   **Implementation**: Mock.
*   **Logic**: The `AnalyticsAgent` class is implemented with `generate_report` and `predict_sales` tools returning simulated data.
*   **Database**: Currently does not query the real database; relies on mock return values.
