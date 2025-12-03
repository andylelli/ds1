import { BaseAgent } from './base.js';
import { getOpenAIClient, DEPLOYMENT_NAME } from '../lib/ai.js';

export class PlannerAgent extends BaseAgent {
  constructor() {
    super('Planner');
  }

  async handlePlanRequest(message) {
    const { goal } = message.params;
    this.log('info', `Creating plan for goal: ${goal}`);
    
    try {
      // Try to use AI if configured
      const client = getOpenAIClient();
      const messages = [
        { role: "system", content: "You are an expert project planner. Break down the user's goal into 3-5 distinct, actionable steps. Return ONLY JSON in the format: { steps: [{ id: number, action: string, description: string }] }." },
        { role: "user", content: goal }
      ];

      const result = await client.getChatCompletions(DEPLOYMENT_NAME, messages);
      const content = result.choices[0].message.content;
      
      // Parse the JSON from AI (simple cleanup for markdown blocks)
      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const planData = JSON.parse(cleanJson);

      this.sendResult(message.id, { plan: { goal, ...planData } });

    } catch (error) {
      this.log('warning', `AI generation failed: ${error.message}. Falling back to static plan.`);
      
      // Fallback logic
      const plan = {
        goal,
        steps: [
          { id: 1, action: 'research', description: 'Gather information (Fallback)' },
          { id: 2, action: 'execute', description: 'Perform the task (Fallback)' },
          { id: 3, action: 'review', description: 'Verify results (Fallback)' }
        ]
      };
      this.sendResult(message.id, { plan });
    }
  }
}
