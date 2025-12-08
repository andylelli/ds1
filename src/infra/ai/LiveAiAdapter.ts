import { AiPort } from '../../core/domain/ports/AiPort.js';
import { openAIService } from './OpenAIService.js';

export class LiveAiAdapter implements AiPort {
    async chat(systemPrompt: string, userMessage: string): Promise<string> {
        try {
            const client = openAIService.getClient();
            const messages = [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ];

            const result = await client.chat.completions.create({
                model: openAIService.deploymentName,
                messages: messages as any,
            });

            return result.choices[0].message.content || "No response generated.";
        } catch (error: any) {
            console.error("OpenAI Error:", error);
            return `Error communicating with AI: ${error.message}`;
        }
    }
}
