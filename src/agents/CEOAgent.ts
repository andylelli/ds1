import { BaseAgent } from './BaseAgent.js';
import { AiPort } from '../core/domain/ports/AiPort.js';
import { PersistencePort } from '../core/domain/ports/PersistencePort.js';

export class CEOAgent extends BaseAgent {
  private ai: AiPort;

  constructor(db: PersistencePort, ai: AiPort) {
    super('CEO', db);
    this.ai = ai;
  }

  async chat(userMessage: string) {
    await this.log('chat_request', { message: userMessage });

    try {
      // 1. Retrieve context from DB
      const logs = await this.db.getRecentLogs(50); // Get last 50 actions
      const context = logs.map((l: any) => `[${l.timestamp}] ${l.agent} (${l.level}): ${JSON.stringify(l.data)}`).join('\n');

      // 2. Ask AI
      const systemPrompt = `You are the CEO of a dropshipping company. You have access to the recent activity logs of your autonomous agent team. 
        
        Recent Activity Logs:
        ${context}
        
        Answer the user's question based on these logs. Be professional, insightful, and authoritative. If you don't know, say so.`;

      const answer = await this.ai.chat(systemPrompt, userMessage);
      
      await this.log('chat_response', { answer });
      
      return answer;

    } catch (error: any) {
      await this.log('error', { error: error.message });
      return "I apologize, but I'm having trouble accessing my reports right now.";
    }
  }

  // The CEO handles high-level planning and orchestration
  async handlePlanRequest(message: any) {
    const { goal } = message.params;
    this.log('info', `CEO is strategizing for goal: ${goal}`);
    
    try {
      const systemPrompt = "You are the CEO of a dropshipping company. Your goal is to orchestrate a team of agents (Product Research, Supplier, Store Build, Marketing, Customer Service, Operations, Analytics). Break down the user's goal into a high-level strategy and assign tasks to these departments. Return a JSON object with a 'strategy' field and a 'delegations' array.";
      
      const content = await this.ai.chat(systemPrompt, goal);
      
      if (!content) throw new Error("No content from AI");

      // Basic cleanup to ensure we get JSON if the model wraps it
      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
      
      let strategyData;
      try {
        strategyData = JSON.parse(cleanJson);
      } catch (e) {
        strategyData = { strategy: content, delegations: [] };
      }

      this.sendResult(message.id, { 
        plan: {
          goal,
          ...strategyData
        }
      });

    } catch (error: any) {
      this.log('error', `CEO failed to plan: ${error.message}`);
      // Fallback plan
      this.sendResult(message.id, { 
        plan: {
          goal,
          strategy: "Manual intervention required. AI service unavailable.",
          delegations: []
        }
      });
    }
  }
}
