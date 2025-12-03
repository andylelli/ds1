import { BaseAgent } from './base.js';
import { getOpenAIClient, DEPLOYMENT_NAME } from '../lib/ai.js';

export class CEOAgent extends BaseAgent {
  constructor() {
    super('CEO');
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
