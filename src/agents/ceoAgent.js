/**
 * CEO Agent (Orchestrator)
 * 
 * What it does:
 * - Acts as the high-level planner and orchestrator.
 * - Uses Generative AI (GPT-4) to break down user goals into actionable strategies.
 * - Delegates tasks to other agents (conceptually).
 * 
 * Interacts with:
 * - Base Agent Class
 * - AI Library (/src/lib/ai.js)
 */
import { BaseAgent } from './base.js';
import { getOpenAIClient, DEPLOYMENT_NAME } from '../lib/ai.js';
import { getRecentLogs } from '../lib/db.js';

export class CEOAgent extends BaseAgent {
  constructor() {
    super('CEO');
  }

  async chat(userMessage) {
    await this.log('chat_request', { message: userMessage });

    try {
      // 1. Retrieve context from DB
      const logs = await getRecentLogs(50); // Get last 50 actions
      const context = logs.map(l => `[${l.timestamp}] ${l.agent} (${l.type}): ${JSON.stringify(l.data)}`).join('\n');

      // 2. Ask AI
      const client = getOpenAIClient();
      const messages = [
        { role: "system", content: `You are the CEO of a dropshipping company. You have access to the recent activity logs of your autonomous agent team. 
        
        Recent Activity Logs:
        ${context}
        
        Answer the user's question based on these logs. Be professional, insightful, and authoritative. If you don't know, say so.` },
        { role: "user", content: userMessage }
      ];

      const result = await client.chat.completions.create({
        model: DEPLOYMENT_NAME,
        messages: messages,
      });

      const answer = result.choices[0].message.content;
      await this.log('chat_response', { answer });
      
      return answer;

    } catch (error) {
      await this.log('error', { error: error.message });
      return "I apologize, but I'm having trouble accessing my reports right now.";
    }
  }

  // The CEO handles high-level planning and orchestration
  async handlePlanRequest(message) {
    const { goal } = message.params;
    this.log('info', `CEO is strategizing for goal: ${goal}`);
    
    try {
      const client = getOpenAIClient();
      const messages = [
        { role: "system", content: "You are the CEO of a dropshipping company. Your goal is to orchestrate a team of agents (Product Research, Supplier, Store Build, Marketing, Customer Service, Operations, Analytics). Break down the user's goal into a high-level strategy and assign tasks to these departments. Return a JSON object with a 'strategy' field and a 'delegations' array." },
        { role: "user", content: goal }
      ];

      const result = await client.chat.completions.create({
        model: DEPLOYMENT_NAME,
        messages: messages,
      });
      const content = result.choices[0].message.content;
      
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

    } catch (error) {
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
