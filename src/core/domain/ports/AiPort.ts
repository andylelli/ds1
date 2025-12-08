export interface AiPort {
    chat(systemPrompt: string, userMessage: string): Promise<string>;
}
