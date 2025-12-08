import { AiPort } from '../../core/domain/ports/AiPort.js';

export class MockAiAdapter implements AiPort {
    async chat(systemPrompt: string, userMessage: string): Promise<string> {
        console.log(`[MockAI] System: ${systemPrompt.substring(0, 50)}...`);
        console.log(`[MockAI] User: ${userMessage}`);

        const lowerMsg = userMessage.toLowerCase();
        
        if (lowerMsg.includes('status')) {
            return "Current System Status: All agents are operational. 3 products are in the research pipeline. (Mock Response)";
        }
        if (lowerMsg.includes('approve')) {
            return "I need to review the margin analysis first. Please provide the Product ID. (Mock Response)";
        }
        if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
            return "Hello. I am the CEO Agent. How can I assist you with the business today? (Mock Response)";
        }

        return "I've received your message. As we are in simulation mode, I can only provide limited responses. (Mock Response)";
    }
}
