# Comprehensive Logging Implementation Plan

## Objective
Ensure every system action and error is persistently logged to specific file destinations with complete context.

- **Error Logs (`logs/error.log`)**: Must contain full stack traces, error context, and timestamp.
- **Activity Logs (`logs/activity.log`)**: Must contain a record of every action, including method calls, MCP calls, and API requests, with full details.
- **External Logs (`logs/{mode}/external.log`)**: Dedicated log for all third-party API interactions.

## 1. Infrastructure Enhancements

### 1.1 Enhanced Logger Service
Modify `src/infra/logging/LoggerService.ts` and `FileLoggerAdapter.ts` to support multi-stream logging and mode-based folders.

- **Folder Structure**:
    - `logs/live/` (for Live mode)
    - `logs/simulation/` (for Simulation/Mock mode)
- **Target State**:
    - `LoggerService` detects the current mode (`live` or `simulation`).
    - Instantiates adapters pointing to the correct subfolder:
        - `logs/{mode}/error.log`
        - `logs/{mode}/activity.log`
        - `logs/{mode}/external.log`

### 1.2 Control Panel Integration Strategy (Avoiding Duplication)
To ensure the Control Panel remains fast and the Database doesn't bloat with debug data, we will use a **Tiered Logging Strategy**:

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
Create a middleware `src/api/middleware/RequestLogger.ts` to log every HTTP request.

- **Capture**:
    - Method (GET, POST, etc.)
    - URL / Path
    - Request Body (sanitized)
    - Response Status
    - Duration (ms)
- **Destination**: `logs/{mode}/activity.log` (File Only - too noisy for DB)

### 2.2 Service/Agent Layer (Method Decorators)
Create a TypeScript decorator `@LogActivity` in `src/core/utils/decorators/LogActivity.ts`.

- **Usage**: Apply to critical methods in Agents and Services.
- **Behavior**:
    - Log "Started [MethodName]" -> File (Debug).
    - Log "Completed [MethodName]" -> File (Debug).
    - **Significant Business Events** inside methods -> DB + File (Info).
    - Catch errors -> DB (Summary) + File (Stack).

### 2.3 MCP Layer (Protocol Interception)
Enhance `src/core/mcp/server.ts` (or the relevant MCP handler) to log all protocol messages.

- **Capture**:
    - Incoming JSON-RPC requests (method, params).
    - Outgoing JSON-RPC responses (result, error).
- **Destination**: `logs/{mode}/activity.log` (Category: MCP)

### 2.4 External Service Wrappers
Instrument `OpenAIService`, `ShopifyAdapter`, and `TrendAdapter` to log to `logs/{mode}/external.log`.

- **Capture**:
    - Endpoint URL
    - Payload size / Token count
    - Latency
    - Rate Limit headers (if available)

### 2.5 Global Error Handling
Ensure no error goes unlogged.

- **Express Error Handler**: Middleware to catch async route errors.
- **Process Handlers**: `uncaughtException`, `unhandledRejection`.
- **Destination**: `logs/{mode}/error.log`

## 3. Log Lifecycle Management

### 3.1 Clearing Logs with Database
Modify `scripts/inspect_db.ts` (or the primary reset script) to include log clearing logic.

- **Trigger**: When `clear-live`, `clear-sim`, or `clear-all` is executed.
- **Action**:
    - If `clear-live`: Truncate `logs/live/*.log`
    - If `clear-sim`: Truncate `logs/simulation/*.log`
    - (Optional) Archive current logs before clearing with a timestamp.

## 4. Execution Steps

1.  **Update Logger Infrastructure**:
    - Update `LoggerService` to detect mode and select `logs/{mode}/` folder.
    - Implement the "Router" logic (DB vs File).

2.  **Instrument External Services**:
    - Add logging to `OpenAIService` and `LiveTrendAdapter`.

3.  **Create Request Middleware**:
    - Implement `requestLogger` middleware.

4.  **Implement Decorators**:
    - Create `@LogActivity` decorator with timing metrics.

5.  **Update Reset Scripts**:
    - Modify `scripts/inspect_db.ts` to clear specific log folders based on the action.

6.  **Verify & Test**:
    - Run simulation, check `logs/simulation/` files.
    - Run DB clear, verify logs are empty.
