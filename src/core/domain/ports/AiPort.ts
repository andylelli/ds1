export interface ToolDefinition {
    name: string;
    description: string;
    parameters: any; // JSON Schema
}

export interface ToolCall {
    id: string;
    name: string;
    arguments: any;
}

export interface AiResponse {
    content: string | null;
    toolCalls?: ToolCall[];
}

export interface AiPort {
    chat(systemPrompt: string, userMessage: string, tools?: ToolDefinition[]): Promise<AiResponse>;
}
