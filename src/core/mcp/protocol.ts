import { z } from 'zod';

// Base MCP Message Schema
export const MCPMessageSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]).optional(),
});

export const MCP_MESSAGE_TYPES = {
    PLAN_REQUEST: 'agent/plan',
    CRITIQUE_REQUEST: 'agent/critique',
    TOOL_CALL: 'tools/call',
    RESOURCE_READ: 'resources/read',
    NOTIFICATION: 'notifications/message'
};

// 1. Task Request (Client asks Agent to do something)
export const TaskRequestSchema = MCPMessageSchema.extend({
  method: z.literal('tools/call'),
  params: z.object({
    name: z.string(),
    arguments: z.record(z.string(), z.any()),
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
    level: z.enum(['debug', 'info', 'warn', 'error']),
    data: z.any(),
  }),
});
