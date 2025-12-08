export class MockAiAdapter {
    async chat(systemPrompt, userMessage, tools) {
        console.log(`[MockAI] System: ${systemPrompt.substring(0, 50)}...`);
        console.log(`[MockAI] User: ${userMessage}`);
        const lowerMsg = userMessage.toLowerCase();
        // Simulate Tool Calls
        if (lowerMsg.includes('approve product')) {
            // Extract ID roughly
            const idMatch = lowerMsg.match(/product\s+(\w+)/);
            const id = idMatch ? idMatch[1] : '123';
            return {
                content: null,
                toolCalls: [{
                        id: 'mock_call_1',
                        name: 'approveProduct',
                        arguments: { productId: id }
                    }]
            };
        }
        if (lowerMsg.includes('status')) {
            return { content: "Current System Status: All agents are operational. 3 products are in the research pipeline. (Mock Response)" };
        }
        if (lowerMsg.includes('approve')) {
            return { content: "I need to review the margin analysis first. Please provide the Product ID. (Mock Response)" };
        }
        if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
            return { content: "Hello. I am the CEO Agent. How can I assist you with the business today? (Mock Response)" };
        }
        return { content: "I've received your message. As we are in simulation mode, I can only provide limited responses. (Mock Response)" };
    }
}
