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

**The Router Logic (`LoggerService`)**:
- `logger.info(event)` -> Writes to **DB** AND **File**.
- `logger.debug(details)` -> Writes to **File ONLY**.
- `logger.error(error)` -> Writes **Summary to DB** AND **Full Stack to File**.

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
External service wrappers (`OpenAIService`, `ShopifyAdapter`, `TrendAdapter`) log to `logs/{mode}/external.log`.

- **Captures**:
    - Endpoint URL
    - Payload size / Token count
    - Response time
    - Success/Failure status

## 9. Planned Updates

### 9.1 Phased Approach for Full Payload Logging
To improve observability without overwhelming storage or performance, we will implement full request/response logging in phases.

#### Phase 1: On-Demand Debug Logging (Current Priority)
- **Goal**: Enable full payload logging only when specifically requested via configuration or environment variable.
- **Implementation**:
    - Add `debug_payloads: boolean` to `config.json`.
    - Update `LiveTrendAdapter`, `OpenAIService`, and `ShopifyAdapter` to check this flag.
    - If true, write full JSON bodies to `logs/{mode}/external_payloads.log` (separate file to keep main logs clean).

#### Phase 2: Sampling Strategy
- **Goal**: Log a percentage of requests to monitor health without full volume.
- **Implementation**:
    - Log 100% of errors (already planned).
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
| Google Trends | Tier 1 | 🟡 Partial | LiveTrendAdapter uses google-trends-api (unofficial). Covers interest over time. |
| Google Ads (Keywords) | Tier 1 | 🔴 Missing | No implementation. Required for search volume validation. |
| Meta Ad Library | Tier 1 | 🔴 Missing | LiveCompetitorAdapter is a stub. Required for saturation checks. |
| YouTube Data | Tier 1 | 🔴 Missing | No implementation. |
| Competitor Scraper | Tier 1 | ⚪ Stub | LiveCompetitorAdapter exists but throws "Not Implemented". |
