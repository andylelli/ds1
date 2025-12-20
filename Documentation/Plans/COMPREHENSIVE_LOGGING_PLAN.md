# Comprehensive Logging Implementation Plan

## Objective
Ensure every system action and error is persistently logged to specific file destinations with complete context.

- **Error Logs (`logs/error.log`)**: Must contain full stack traces, error context, and timestamp.
- **Activity Logs (`logs/activity.log`)**: Must contain a record of every action, including method calls, MCP calls, and API requests, with full details.
- **External Logs (`logs/external.log`)**: Dedicated log for all third-party API interactions (OpenAI, Shopify, Google Trends) to track costs, latency, and rate limits.

## 1. Infrastructure Enhancements

### 1.1 Enhanced Logger Service
Modify `src/infra/logging/LoggerService.ts` and `FileLoggerAdapter.ts` to support multi-stream logging.

- **Current State**: Single `app.log` or console.
- **Target State**:
    - `LoggerService` manages distinct streams:
        - `errorStream` -> `logs/error.log`
        - `activityStream` -> `logs/activity.log`
        - `externalStream` -> `logs/external.log`

### 1.2 Log Format Standards
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
Create a middleware `src/api/middleware/RequestLogger.ts` to log every HTTP request.

- **Capture**:
    - Method (GET, POST, etc.)
    - URL / Path
    - Request Body (sanitized)
    - Response Status
    - Duration (ms)
- **Destination**: `logs/activity.log`

### 2.2 Service/Agent Layer (Method Decorators)
Create a TypeScript decorator `@LogActivity` in `src/core/utils/decorators/LogActivity.ts`.

- **Usage**: Apply to critical methods in Agents and Services.
- **Behavior**:
    - Log "Started [MethodName]" with arguments.
    - Log "Completed [MethodName]" with result (or summary) and **Execution Time**.
    - Catch errors, log to `error.log`, and re-throw.

### 2.3 MCP Layer (Protocol Interception)
Enhance `src/core/mcp/server.ts` (or the relevant MCP handler) to log all protocol messages.

- **Capture**:
    - Incoming JSON-RPC requests (method, params).
    - Outgoing JSON-RPC responses (result, error).
- **Destination**: `logs/activity.log` (Category: MCP)

### 2.4 External Service Wrappers
Instrument `OpenAIService`, `ShopifyAdapter`, and `TrendAdapter` to log to `logs/external.log`.

- **Capture**:
    - Endpoint URL
    - Payload size / Token count
    - Latency
    - Rate Limit headers (if available)

### 2.5 Global Error Handling
Ensure no error goes unlogged.

- **Express Error Handler**: Middleware to catch async route errors.
- **Process Handlers**: `uncaughtException`, `unhandledRejection`.
- **Destination**: `logs/error.log`

## 3. Log Lifecycle Management

### 3.1 Clearing Logs with Database
Modify `scripts/inspect_db.ts` (or the primary reset script) to include log clearing logic.

- **Trigger**: When `clear-live`, `clear-sim`, or `clear-all` is executed.
- **Action**:
    - Truncate `logs/activity.log`
    - Truncate `logs/error.log`
    - Truncate `logs/external.log`
    - (Optional) Archive current logs before clearing with a timestamp.

## 4. Execution Steps

1.  **Update Logger Infrastructure**:
    - Update `LoggerService` to support `error`, `activity`, and `external` streams.

2.  **Instrument External Services**:
    - Add logging to `OpenAIService` and `LiveTrendAdapter`.

3.  **Create Request Middleware**:
    - Implement `requestLogger` middleware.

4.  **Implement Decorators**:
    - Create `@LogActivity` decorator with timing metrics.

5.  **Update Reset Scripts**:
    - Modify `scripts/inspect_db.ts` to clear log files when clearing DB.

6.  **Verify & Test**:
    - Run simulation, check all 3 log files.
    - Run DB clear, verify logs are empty.
