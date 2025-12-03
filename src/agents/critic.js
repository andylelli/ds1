import { BaseAgent } from './base.js';

export class CriticAgent extends BaseAgent {
  constructor() {
    super('Critic');
  }

  async handleCritiqueRequest(message) {
    const { task, output } = message.params;
    this.log('info', `Critiquing output for task: ${task}`);

    // Simulate AI critique logic
    const score = Math.random() > 0.5 ? 'pass' : 'needs_improvement';
    const feedback = score === 'pass' ? 'Looks good!' : 'Please add more details.';

    this.sendResult(message.id, {
      critique: {
        score,
        feedback
      }
    });
  }
}
