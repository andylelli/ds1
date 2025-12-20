# Comprehensive Logging Implementation Plan

## Objective
Ensure every system action and error is persistently logged to specific file destinations with complete context.

- **Error Logs (`logs/error.log`)**: Must contain full stack traces, error context, and timestamp.
- **Activity Logs (`logs/activity.log`)**: Must contain a record of every action, including method calls, MCP calls, and API requests, with full details.

## 1. Infrastructure Enhancements

### 1.1 Enhanced Logger Service
Modify `src/infra/logging/LoggerService.ts` and `FileLoggerAdapter.ts` to support dual-stream logging.

- **Current State**: Single `app.log` or console.
- **Target State**:
    - `LoggerService` manages two distinct streams: `errorStream` and `activityStream`.
    - `error()` calls write to `logs/error.log`.
    - `info()`, `debug()`, `warn()` calls write to `logs/activity.log`.

### 1.2 Log Format Standards
- **Error Log Format**:
  ```text
  [ISO_TIMESTAMP] [ERROR] [Source:Component] Message
  Context: { ...json_data }
  Stack Trace:
  Error: ...
      at Function.method (file.ts:10:20)
      ...
  ```
- **Activity Log Format**:
  ```text
  [ISO_TIMESTAMP] [INFO] [Category] [Action] Message
  Details: { method: "methodName", args: [...], ... }
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
    - Log "Completed [MethodName]" with result (or summary).
    - Catch errors, log to `error.log`, and re-throw.

### 2.3 MCP Layer (Protocol Interception)
Enhance `src/core/mcp/server.ts` (or the relevant MCP handler) to log all protocol messages.

- **Capture**:
    - Incoming JSON-RPC requests (method, params).
    - Outgoing JSON-RPC responses (result, error).
- **Destination**: `logs/activity.log` (Category: MCP)

### 2.4 Global Error Handling
Ensure no error goes unlogged.

- **Express Error Handler**: Middleware to catch async route errors.
- **Process Handlers**:
    - `uncaughtException`
    - `unhandledRejection`
- **Destination**: `logs/error.log`

## 3. Execution Steps

1.  **Update Logger Infrastructure**:
    - Modify `FileLoggerAdapter` to accept a filename in constructor.
    - Update `LoggerService` to instantiate two adapters: `errorLogger` (`error.log`) and `activityLogger` (`activity.log`).

2.  **Create Request Middleware**:
    - Implement `requestLogger` middleware.
    - Register it in `src/index.ts` before routes.

3.  **Implement Decorators**:
    - Create `@LogActivity` decorator.
    - Apply to `BaseAgent` methods and key Service methods.

4.  **Instrument MCP Server**:
    - Add logging hooks in `MCPServer.handleMessage`.

5.  **Verify & Test**:
    - Run a simulation.
    - Check `logs/error.log` for forced errors.
    - Check `logs/activity.log` for flow trace.

## 4. File Rotation Policy (Future)
- Implement log rotation (e.g., daily or size-based) to prevent files from growing indefinitely.
- Archive old logs to `logs/archive/`.
