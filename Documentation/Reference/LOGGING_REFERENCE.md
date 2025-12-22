# Logging System Reference

## Overview
This document describes the logging architecture used in the DropShip system. The system ensures every system action and error is persistently logged to specific file destinations with complete context.

- **Error Logs (`logs/error.log`)**: Contains full stack traces, error context, and timestamps.
- **Activity Logs (`logs/activity.log`)**: Contains a record of every action, including method calls, MCP calls, and API requests, with full details.
- **External Logs (`logs/{mode}/external.log`)**: Dedicated log for all third-party API interactions.

## 1. Infrastructure

### 1.1 Logger Service
The `LoggerService` (`src/infra/logging/LoggerService.ts`) and `FileLoggerAdapter` support multi-stream logging and mode-based folders.

- **Folder Structure**:
    - `logs/live/` (for Live mode)
    - `logs/simulation/` (for Simulation/Mock mode)
- **Behavior**:
    - `LoggerService` detects the current mode (`live` or `simulation`).
    - Instantiates adapters pointing to the correct subfolder:
        - `logs/{mode}/error.log`
        - `logs/{mode}/activity.log`
        - `logs/{mode}/external.log`

### 1.2 Tiered Logging Strategy
To ensure the Control Panel remains fast and the Database doesn't bloat with debug data, the system uses a **Tiered Logging Strategy**:

1.  **Database (`activity_log` table)**:
    - **Purpose**: Power the Control Panel UI.
    - **Content**: High-level business events only (e.g., "Research Started", "Item Staged", "Error Occurred").
    - **Retention**: Rotated frequently (e.g., last 1000 events).

2.  **File Logs (`logs/{mode}/*.log`)**:
    - **Purpose**: Deep debugging, auditing, and compliance.
    - **Content**: *Everything*. Full stack traces, raw API payloads, debug messages.
    - **Retention**: Archived daily/weekly.

**The Router Logic (Separation of Concerns)**:
- **`ActivityLogService`**: Must be called explicitly to write business events to the **DB** (for the UI).
- **`LoggerService`**: Must be called to write technical details to **Files** (for debugging).

*Note: In the future, we may merge these into a single facade, but currently they are separate services.*

### 1.3 Log Format Standards
- **Error Log Format**:
  ```text
  [ISO_TIMESTAMP] [ERROR] [Source:Component] Message
  Context: { ...json_data }
  Stack Trace:
  Error: ...
  ```
- **Activity Log Format**:
  ```text
  [ISO_TIMESTAMP] [INFO] [Category] [Action] Message
  Details: { method: "methodName", args: [...], ... }
  ```
- **External Log Format**:
  ```text
  [ISO_TIMESTAMP] [INFO] [Provider:OpenAI] [200 OK] [1450ms]
  Request: { model: "gpt-4", tokens: 500 }
  Response: { ... }
  Cost: $0.03
  ```
  *Note: All JSON data in logs should be pretty-printed for readability. Every significant action and key data structure must be captured.*

## 2. Implementation Layers

### 2.1 API Layer (Express Middleware)
The middleware `src/api/middleware/RequestLogger.ts` logs every HTTP request.

- **Captures**:
    - Method (GET, POST, etc.)
    - URL / Path
    - Request Body (sanitized)
    - Response Status
    - Duration (ms)
- **Destination**: `logs/{mode}/activity.log` (File Only - too noisy for DB)

### 2.2 Service/Agent Layer (Method Decorators)
The TypeScript decorator `@LogActivity` in `src/core/utils/decorators/LogActivity.ts` is used on critical methods.

- **Behavior**:
    - Log "Started [MethodName]" -> File (Debug).
    - Log "Completed [MethodName]" -> File (Debug).
    - **Significant Business Events** inside methods -> DB + File (Info).
    - Catch errors -> DB (Summary) + File (Stack).

### 2.3 MCP Layer (Protocol Interception)
The `src/core/mcp/server.ts` (or relevant MCP handler) logs all protocol messages.

- **Captures**:
    - Incoming JSON-RPC requests (method, params).
    - Outgoing JSON-RPC responses (result, error).
- **Destination**: `logs/{mode}/activity.log` (Category: MCP)

### 2.4 External Service Wrappers
External service wrappers (`OpenAIService`, `ShopifyAdapter`, `TrendAdapter`, `LiveCompetitorAdapter`) log to `logs/{mode}/external.log`.

- **Captures**:
  - Endpoint URL
  - Payload size / Token count
  - Response time
  - Success/Failure status
  - **Significant Actions**: Every significant action must be logged.
  - **Data Structures**: Key data structures involved in the request/response.
  - **Formatting**: Any JSON data must be pretty-printed for readability.

- **Specific Adapter Details**:
  - **SERPApi and Meta Ad Library (via `LiveCompetitorAdapter`)**:
    - Category, query, competitor count, saturation score, brand, ad count.
    - Error details (if any).
  - **Shopify (via `LiveShopAdapter`)**:
    - Product creation, listing, and retrieval actions.
    - Details: Product name, category, price, count.
    - Brief summary of the request.
    - Status: Whether the call was successful or errored.
    - Error details (if any).

## 9. Planned Updates

### 9.1 Phased Approach for Full Payload Logging
To improve observability without overwhelming storage or performance, we will implement full request/response logging in phases.

#### Phase 1: On-Demand Full Debug Logging
- **Goal**: Enable full raw payload logging (headers, full bodies) only when specifically requested.
- **Implementation**:
    - Add `debug_payloads: boolean` to `config.json`.
    - If true, write full raw JSON bodies to `logs/{mode}/external_payloads.log` (separate file).

#### Phase 2: Sampling Strategy
- **Goal**: Log a percentage of requests to monitor health without full volume.
- **Implementation**:
    - Log 100% of errors.
    - Log 5% of successful requests with full payloads.

#### Phase 3: Rolling Window Retention
- **Goal**: Keep full logs for 24 hours, then archive/delete.
- **Implementation**:
    - Use a log rotation library (e.g., `winston-daily-rotate-file` if we migrate, or custom script).

### 9.2 API Request/Response Examples

Below are examples of what the **External Log** entries will look like when full payload logging is enabled.

#### Google Trends API (`interestOverTime`)
**Request**:
```json
{
  "provider": "GoogleTrends",
  "method": "interestOverTime",
  "params": {
    "keyword": "Smart Home",
    "startTime": "2025-09-21T00:00:00.000Z",
    "geo": "US"
  }
}
```
**Response**:
```json
{
  "default": {
    "timelineData": [
      { "time": "1726963200", "formattedTime": "Sep 22 – 28, 2025", "formattedAxisTime": "Sep 22", "value": [78], "hasData": [true], "formattedValue": ["78"] },
      { "time": "1727568000", "formattedTime": "Sep 29 – Oct 5, 2025", "formattedAxisTime": "Sep 29", "value": [82], "hasData": [true], "formattedValue": ["82"] }
    ]
  }
}
```

#### OpenAI API (`chat.completions`)
**Request**:
```json
{
  "provider": "OpenAI",
  "endpoint": "https://api.openai.com/v1/chat/completions",
  "body": {
    "model": "gpt-4",
    "messages": [
      { "role": "system", "content": "You are a product researcher..." },
      { "role": "user", "content": "Analyze trends for 'Smart Home'..." }
    ],
    "temperature": 0.7
  }
}
```
**Response**:
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4-0613",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Based on the data, Smart Home security is rising..."
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 50,
    "total_tokens": 200
  }
}
```

### 9.3 Integration Status

| Integration | Priority | Status | Implementation Notes |
|---|---|---|---|
| Google Trends | Tier 1 | � Active | LiveTrendAdapter uses google-trends-api. Logs detailed summaries and data structures to external.log (pretty-printed). |
| Google Ads (Keywords) | Tier 1 | 🟢 Active | LiveAdsAdapter connected via google-ads-api. Logs all API calls to external.log. |
| Meta Ad Library | Tier 1 | 🟢 Active | LiveCompetitorAdapter logs detailed ad search results and metrics to external.log (pretty-printed). |
| SERPApi (Competitor Scraper) | Tier 1 | 🟢 Active | LiveCompetitorAdapter logs detailed competitor analysis and saturation scores to external.log (pretty-printed). |
| Shopify | Tier 1 | 🟢 Active | LiveShopAdapter logs detailed product actions (create/list/get) with summaries and response data to external.log (pretty-printed). |
| YouTube Data | Tier 1 | 🟢 Active | LiveVideoAdapter logs all YouTube search and video detail API calls to external.log. |
| OpenAI | Tier 1 | 🟢 Active | LiveAiAdapter logs chat requests and response summaries to external.log (pretty-printed). |
