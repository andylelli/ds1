import { AiPort, AiResponse, ToolDefinition } from '../../core/domain/ports/AiPort.js';

export class MockAiAdapter implements AiPort {
    async chat(systemPrompt: string, userMessage: string, tools?: ToolDefinition[]): Promise<AiResponse> {
        console.log(`[MockAI] System: ${systemPrompt.substring(0, 50)}...`);
        console.log(`[MockAI] User: ${userMessage}`);

        const lowerMsg = userMessage.toLowerCase();
        
        // 1. Product Review Scenario (CEO Agent)
        if (systemPrompt.includes('Review this product candidate')) {
            // Try to extract product details to make a "smart" decision
            let product: any = {};
            try {
                const match = systemPrompt.match(/Product: ({.*})/s);
                if (match) {
                    product = JSON.parse(match[1]);
                }
            } catch (e) {
                console.log('[MockAI] Failed to parse product from prompt');
            }

            // Simple logic: Approve if margin > 50% (string "60%")
            let approved = false;
            if (product.margin) {
                const marginNum = parseInt(product.margin.replace('%', ''));
                if (marginNum > 50) approved = true;
            }
            
            // Random override for variety
            if (Math.random() > 0.9) approved = !approved;

            if (approved) {
                return {
                    content: null,
                    toolCalls: [{
                        id: `call_${Date.now()}`,
                        name: 'approveProduct',
                        arguments: { reason: `High margin (${product.margin}) and good potential.` }
                    }]
                };
            } else {
                return {
                    content: null,
                    toolCalls: [{
                        id: `call_${Date.now()}`,
                        name: 'rejectProduct',
                        arguments: { reason: `Margin (${product.margin}) is too low for our strategy.` }
                    }]
                };
            }
        }

        // 2. Supplier Review Scenario (CEO Agent)
        if (systemPrompt.includes('Review this supplier candidate')) {
             let supplier: any = {};
             try {
                 const match = systemPrompt.match(/Supplier: ({.*})/s);
                 if (match) {
                     supplier = JSON.parse(match[1]);
                 }
             } catch (e) {
                 console.log('[MockAI] Failed to parse supplier from prompt');
             }

             // Simple logic: Approve if rating >= 4.5
             let approved = false;
             if (supplier.rating && supplier.rating >= 4.5) {
                 approved = true;
             }

             if (approved) {
                 return {
                     content: null,
                     toolCalls: [{
                         id: `call_${Date.now()}`,
                         name: 'approveSupplier',
                         arguments: { reason: `High rating (${supplier.rating}) and reliable.` }
                     }]
                 };
             } else {
                 return {
                     content: null,
                     toolCalls: [{
                         id: `call_${Date.now()}`,
                         name: 'rejectSupplier',
                         arguments: { reason: `Rating (${supplier.rating}) is too low.` }
                     }]
                 };
             }
        }

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
