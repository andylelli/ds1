import { AiPort, AiResponse, ToolDefinition } from '../../core/domain/ports/AiPort.js';
import { openAIService } from './OpenAIService.js';
import { ActivityLogService } from '../../core/services/ActivityLogService.js';
import { Pool } from 'pg';

const _SHOW_DEBUG_ENV = process.env.DEBUG_ENV === 'true';

export class LiveAiAdapter implements AiPort {
    private activityLog: ActivityLogService | null = null;

    // Simple retry + circuit-breaker implementation to protect AI calls
    private static _failureCount = 0;
    private static _failureWindowMs = 1000 * 60; // 1 minute window
    private static _failureThreshold = 5;
    private static _openUntil = 0; // timestamp ms until circuit is open
    private static _openDurationMs = 1000 * 60; // 1 minute open
    private static _lastFailureTime = 0;

    constructor(pool?: Pool) {
        if (pool) {
            this.activityLog = new ActivityLogService(pool);
        }
    }

    async chat(systemPrompt: string, userMessage: string, tools?: ToolDefinition[]): Promise<AiResponse> {
        const now = Date.now();
        if (LiveAiAdapter._openUntil && now < LiveAiAdapter._openUntil) {
            return { content: 'Service temporarily unavailable (circuit open). Try again later.' };
        }

        const maxAttempts = 3;
        let lastErr: any = null;

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

                const request: any = {
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
                    toolCalls: choice.message.tool_calls?.map((tc: any) => ({
                        id: tc.id,
                        name: tc.function.name,
                        arguments: JSON.parse(tc.function.arguments)
                    }))
                };

            } catch (err: any) {
                lastErr = err;
                console.error(`[LiveAiAdapter] attempt ${attempt} failed:`, err?.message || err);
                if (_SHOW_DEBUG_ENV) console.error(err);

                if (this.activityLog) {
                    await this.activityLog.log({
                        agent: 'System',
                        action: 'ai_chat',
                        category: 'system',
                        status: 'failed',
                        message: `AI Chat failed attempt ${attempt}`,
                        details: { 
                            error: err.message, 
                            stack: err.stack, 
                            fullError: JSON.stringify(err, Object.getOwnPropertyNames(err)),
                            attempt,
                            deployment: openAIService.deploymentName
                        }
                    }).catch(e => console.error('Failed to log AI error to DB:', e));
                }

                // increment failure count and possibly open circuit
                LiveAiAdapter._failureCount = (LiveAiAdapter._failureCount || 0) + 1;
                const windowPassed = (now - (LiveAiAdapter['_lastFailureTime'] || 0)) > LiveAiAdapter._failureWindowMs;
                if (windowPassed) {
                    // reset count if outside window
                    LiveAiAdapter._failureCount = 1;
                }
                (LiveAiAdapter as any)['_lastFailureTime'] = now;

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

        const finalErrorMsg = `Error communicating with AI: ${lastErr?.message || 'unknown error'}`;
        
        if (this.activityLog) {
            await this.activityLog.log({
                agent: 'System',
                action: 'ai_chat',
                category: 'system',
                status: 'failed',
                message: `AI Chat failed all attempts`,
                details: { 
                    error: lastErr?.message, 
                    stack: lastErr?.stack, 
                    fullError: lastErr ? JSON.stringify(lastErr, Object.getOwnPropertyNames(lastErr)) : 'null'
                }
            }).catch(e => console.error('Failed to log AI final error to DB:', e));
        }

        return { content: finalErrorMsg };
    }
}
