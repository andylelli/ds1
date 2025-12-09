import { openAIService } from './OpenAIService.js';
const _SHOW_DEBUG_ENV = process.env.DEBUG_ENV === 'true';
export class LiveAiAdapter {
    // Simple retry + circuit-breaker implementation to protect AI calls
    static _failureCount = 0;
    static _failureWindowMs = 1000 * 60; // 1 minute window
    static _failureThreshold = 5;
    static _openUntil = 0; // timestamp ms until circuit is open
    static _openDurationMs = 1000 * 60; // 1 minute open
    static _lastFailureTime = 0;
    async chat(systemPrompt, userMessage, tools) {
        const now = Date.now();
        if (LiveAiAdapter._openUntil && now < LiveAiAdapter._openUntil) {
            return { content: 'Service temporarily unavailable (circuit open). Try again later.' };
        }
        const maxAttempts = 3;
        let lastErr = null;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                if (_SHOW_DEBUG_ENV) {
                    console.log('[LiveAiAdapter] process.env.AZURE_OPENAI_ENDPOINT (at chat call)=', process.env.AZURE_OPENAI_ENDPOINT);
                    console.log('[LiveAiAdapter] openAIService deployment=', openAIService.deploymentName);
                }
                const client = openAIService.getClient();
                const messages = [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ];
                const request = {
                    model: openAIService.deploymentName,
                    messages
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
                // success -> reset failure count
                LiveAiAdapter._failureCount = 0;
                return {
                    content: choice.message.content,
                    toolCalls: choice.message.tool_calls?.map((tc) => ({
                        id: tc.id,
                        name: tc.function.name,
                        arguments: JSON.parse(tc.function.arguments)
                    }))
                };
            }
            catch (err) {
                lastErr = err;
                console.error(`[LiveAiAdapter] attempt ${attempt} failed:`, err?.message || err);
                if (_SHOW_DEBUG_ENV)
                    console.error(err);
                // increment failure count and possibly open circuit
                LiveAiAdapter._failureCount = (LiveAiAdapter._failureCount || 0) + 1;
                const windowPassed = (now - (LiveAiAdapter['_lastFailureTime'] || 0)) > LiveAiAdapter._failureWindowMs;
                if (windowPassed) {
                    // reset count if outside window
                    LiveAiAdapter._failureCount = 1;
                }
                LiveAiAdapter['_lastFailureTime'] = now;
                if (LiveAiAdapter._failureCount >= LiveAiAdapter._failureThreshold) {
                    LiveAiAdapter._openUntil = Date.now() + LiveAiAdapter._openDurationMs;
                    console.warn('[LiveAiAdapter] Circuit opened until', new Date(LiveAiAdapter._openUntil).toISOString());
                    break;
                }
                // exponential backoff before retry
                const backoff = 200 * Math.pow(2, attempt - 1);
                await new Promise(r => setTimeout(r, backoff));
            }
        }
        return { content: `Error communicating with AI: ${lastErr?.message || 'unknown error'}` };
    }
}
