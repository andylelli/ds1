/**
 * Model Context Protocol (MCP) Definitions
 * 
 * What it does:
 * - Defines the JSON-RPC message schemas using Zod.
 * - Specifies message types for Tasks, Plans, Resources, and Logs.
 * 
 * Interacts with:
 * - MCP Server (/src/mcp/server.js)
 * - Base Agent (/src/agents/base.js)
 * - Main Server (/src/index.js)
 */
import { z } from 'zod';

// Base MCP Message Schema
export const MCPMessageSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.string().or(z.number()).optional(),
});

// 1. Task Request (Client asks Agent to do something)
export const TaskRequestSchema = MCPMessageSchema.extend({
  method: z.literal('tools/call'),
  params: z.object({
    name: z.string(),
    arguments: z.record(z.any()),
  }),
});

// 2. Task Response (Agent responds with result)
export const TaskResponseSchema = MCPMessageSchema.extend({
  result: z.object({
    content: z.array(z.object({
      type: z.string(),
      text: z.string(),
    })),
  }),
});

// 3. Resource Request (Client asks for a resource/context)
export const ResourceRequestSchema = MCPMessageSchema.extend({
  method: z.literal('resources/read'),
  params: z.object({
    uri: z.string(),
  }),
});

// 4. Log/Notification (Agent sends updates)
export const LogMessageSchema = MCPMessageSchema.extend({
  method: z.literal('notifications/message'),
  params: z.object({
    level: z.enum(['debug', 'info', 'warning', 'error']),
    data: z.any(),
  }),
});

// 5. Plan Request (Orchestrator asks Agent to create a plan)
export const PlanRequestSchema = MCPMessageSchema.extend({
  method: z.literal('agent/plan'),
  params: z.object({
    goal: z.string(),
    context: z.any().optional(),
  }),
});

// 6. Critique Request (Agent asks another to review output)
export const CritiqueRequestSchema = MCPMessageSchema.extend({
  method: z.literal('agent/critique'),
  params: z.object({
    task: z.string(),
    output: z.string(),
  }),
});

export const MCP_MESSAGE_TYPES = {
  TASK_REQUEST: 'tools/call',
  RESOURCE_REQUEST: 'resources/read',
  LOG_NOTIFICATION: 'notifications/message',
  PLAN_REQUEST: 'agent/plan',
  CRITIQUE_REQUEST: 'agent/critique',
};
