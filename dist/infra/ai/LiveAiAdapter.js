import { openAIService } from './OpenAIService.js';
export class LiveAiAdapter {
    async chat(systemPrompt, userMessage, tools) {
        try {
            const client = openAIService.getClient();
            const messages = [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ];
            const request = {
                model: openAIService.deploymentName,
                messages: messages,
            };
            if (tools && tools.length > 0) {
                request.tools = tools.map(t => ({
                    type: 'function',
                    function: {
                        name: t.name,
                        description: t.description,
                        parameters: t.parameters
                    }
                }));
            }
            const result = await client.chat.completions.create(request);
            const choice = result.choices[0];
            return {
                content: choice.message.content,
                toolCalls: choice.message.tool_calls?.map(tc => ({
                    id: tc.id,
                    name: tc.function.name,
                    arguments: JSON.parse(tc.function.arguments)
                }))
            };
        }
        catch (error) {
            console.error("OpenAI Error:", error);
            return { content: `Error communicating with AI: ${error.message}` };
        }
    }
}
