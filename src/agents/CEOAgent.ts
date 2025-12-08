import { BaseAgent } from './BaseAgent.js';
import { AiPort, ToolDefinition } from '../core/domain/ports/AiPort.js';
import { PersistencePort } from '../core/domain/ports/PersistencePort.js';

// Define a Team interface to avoid circular imports if possible, or just use any for now
interface Team {
    research: any;
    supplier: any;
    store: any;
    marketing: any;
    support: any;
    ops: any;
    analytics: any;
}

export class CEOAgent extends BaseAgent {
  private ai: AiPort;
  private team: Team | null = null;
  
  private aiTools: ToolDefinition[] = [
    {
      name: 'approveProduct',
      description: 'Approve a product for sale.',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Reason for approval' }
        },
        required: ['reason']
      }
    },
    {
      name: 'rejectProduct',
      description: 'Reject a product.',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Reason for rejection' }
        },
        required: ['reason']
      }
    },
    {
        name: 'startProductResearch',
        description: 'Instruct the Research Agent to find winning products in a specific category.',
        parameters: {
            type: 'object',
            properties: {
                category: { type: 'string', description: 'The niche or category to research (e.g., "Fitness", "Pet Supplies")' }
            },
            required: ['category']
        }
    },
    {
        name: 'sourceProduct',
        description: 'Instruct the Supplier Agent to find suppliers for a specific product.',
        parameters: {
            type: 'object',
            properties: {
                productId: { type: 'string', description: 'The ID of the product to source' }
            },
            required: ['productId']
        }
    },
    {
        name: 'buildStorePage',
        description: 'Instruct the Store Agent to create a product page.',
        parameters: {
            type: 'object',
            properties: {
                productId: { type: 'string', description: 'The ID of the product to build a page for' }
            },
            required: ['productId']
        }
    },
    {
        name: 'launchMarketingCampaign',
        description: 'Instruct the Marketing Agent to launch an ad campaign.',
        parameters: {
            type: 'object',
            properties: {
                productId: { type: 'string', description: 'The ID of the product to market' },
                platform: { type: 'string', description: 'The ad platform (Facebook, TikTok, Instagram)' },
                budget: { type: 'number', description: 'The budget for the campaign' }
            },
            required: ['productId', 'platform', 'budget']
        }
    }
  ];

  constructor(db: PersistencePort, ai: AiPort) {
    super('CEO', db);
    this.ai = ai;
  }

  public setTeam(team: Team) {
      this.team = team;
  }

  async chat(userMessage: string) {
    console.log('[CEOAgent.chat] called with:', userMessage);
      console.log('[CEOAgent] Using AI adapter:', this.ai);
    await this.log('chat_request', { message: userMessage });

    try {
      // 1. Retrieve comprehensive context
      const [logs, products, orders, campaigns] = await Promise.all([
        this.db.getRecentLogs(50),
        this.db.getProducts(),
        this.db.getOrders(),
        this.db.getCampaigns()
      ]);

      // 2. Format Context for AI
      const logContext = logs.map((l: any) => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.agent}: ${l.message}`).join('\n');
      
      const productContext = products.length > 0 
        ? products.map((p: any) => `- ${p.name} (ID: ${p.id}, Status: ${p.status || 'Research'}, Margin: ${p.margin || 'N/A'}%)`).join('\n')
        : "No active products.";

      const financialContext = `
      Total Orders: ${orders.length}
      Active Ad Campaigns: ${campaigns.length}
      Recent Revenue: $${orders.reduce((acc: number, o: any) => acc + (o.amount || 0), 0).toFixed(2)}
      `;

      // 3. Construct System Prompt
      const systemPrompt = `You are the CEO of a dropshipping company. You have access to the real-time state of your business.
        
        === 📊 BUSINESS SNAPSHOT ===
        ${financialContext}

        === 📦 PRODUCT PORTFOLIO ===
        ${productContext}

        === 📜 RECENT AGENT ACTIVITY ===
        ${logContext}
        
        Instructions:
        1. Answer the user's question based strictly on the data above.
        2. Be professional, insightful, and authoritative.
        3. You have access to tools to manage the entire business lifecycle:
           - Research new products
           - Approve/Reject products
           - Source products
           - Build store pages
           - Launch marketing campaigns
        4. Use these tools when the user asks you to perform an action.
        5. If you don't know the answer, say so.`;

      // 4. Define Tools
      const tools = this.aiTools;

      const response = await this.ai.chat(systemPrompt, userMessage, tools);
      
      // 5. Handle Tool Calls
      if (response.toolCalls && response.toolCalls.length > 0) {
          for (const tool of response.toolCalls) {
              if (tool.name === 'approveProduct') {
                  await this.approveProduct(tool.arguments.productId);
                  return `I have approved product ${tool.arguments.productId}. The team will proceed immediately.`;
              }
              if (tool.name === 'rejectProduct') {
                  await this.rejectProduct(tool.arguments.productId, tool.arguments.reason);
                  return `I have rejected product ${tool.arguments.productId}. Reason: ${tool.arguments.reason}`;
              }
              if (tool.name === 'startProductResearch') {
                  if (!this.team) return "I cannot start research because my team is not assembled.";
                  // Run in background to avoid timeout
                  this.team.research.findWinningProducts({ category: tool.arguments.category }).catch((err: any) => console.error(err));
                  return `I have instructed the Research team to look for products in the ${tool.arguments.category} category. Check back in a moment for results.`;
              }
              if (tool.name === 'sourceProduct') {
                  if (!this.team) return "I cannot source products because my team is not assembled.";
                  this.team.supplier.findSuppliers({ product_id: tool.arguments.productId }).catch((err: any) => console.error(err));
                  return `I have instructed the Supplier team to find suppliers for product ${tool.arguments.productId}.`;
              }
              if (tool.name === 'buildStorePage') {
                  if (!this.team) return "I cannot build the store because my team is not assembled.";
                  const products = await this.db.getProducts();
                  const product = products.find((p: any) => p.id === tool.arguments.productId);
                  if (!product) return `Product ${tool.arguments.productId} not found.`;
                  
                  this.team.store.createProductPage({ product_data: product }).catch((err: any) => console.error(err));
                  return `I have instructed the Store team to build the page for ${product.name}.`;
              }
              if (tool.name === 'launchMarketingCampaign') {
                  if (!this.team) return "I cannot launch campaigns because my team is not assembled.";
                  const products = await this.db.getProducts();
                  const product = products.find((p: any) => p.id === tool.arguments.productId);
                  if (!product) return `Product ${tool.arguments.productId} not found.`;

                  this.team.marketing.createAdCampaign({
                      platform: tool.arguments.platform,
                      budget: tool.arguments.budget,
                      product: product.name
                  }).catch((err: any) => console.error(err));
                  return `I have instructed the Marketing team to launch a ${tool.arguments.platform} campaign for ${product.name} with a budget of $${tool.arguments.budget}.`;
              }
          }
      }

      const answer = response.content || "I processed your request.";
      await this.log('chat_response', { answer });
      
      return answer;

    } catch (error: any) {
      await this.log('error', { error: error.message });
      return "I apologize, but I'm having trouble accessing my reports right now.";
    }
  }

  // --- Tool Implementations ---
  private async approveProduct(productId: string) {
      await this.log('action', { action: 'approve_product', productId });
      // TODO: Update product status in DB
      // TODO: Emit event to EventBus
      console.log(`[CEO] APPROVED PRODUCT ${productId}`);
  }

  private async rejectProduct(productId: string, reason: string) {
      await this.log('action', { action: 'reject_product', productId, reason });
      // TODO: Update product status in DB
      console.log(`[CEO] REJECTED PRODUCT ${productId}`);
  }

  async evaluateProduct(product: any): Promise<{ approved: boolean; reason: string }> {
    const systemPrompt = "You are a strict CEO. Evaluate the product proposal.";
    const userMessage = `Product: ${product.name}. Description: ${product.description}. Price: ${product.price}. Should we sell this?`;
    
    try {
      const response = await this.ai.chat(systemPrompt, userMessage, this.aiTools);

      // Check for tool calls
      if (response.toolCalls && response.toolCalls.length > 0) {
          const call = response.toolCalls[0];
          if (call.name === 'approveProduct') {
              await this.approveProduct(product.id);
              return { approved: true, reason: call.arguments.reason || "Approved by AI" };
          } else if (call.name === 'rejectProduct') {
              await this.rejectProduct(product.id, call.arguments.reason);
              return { approved: false, reason: call.arguments.reason || "Rejected by AI" };
          }
      }

      // Fallback if no tool called (or text response)
      return { approved: false, reason: "AI did not make a clear decision: " + response.content };
    } catch (error: any) {
      console.error("CEO Evaluation Error:", error);
      return { approved: false, reason: "Error during evaluation: " + error.message };
    }
  }

  // The CEO handles high-level planning and orchestration
  async handlePlanRequest(message: any) {
    const { goal } = message.params;
    this.log('info', `CEO is strategizing for goal: ${goal}`);
    
    try {
      const systemPrompt = "You are the CEO of a dropshipping company. Your goal is to orchestrate a team of agents (Product Research, Supplier, Store Build, Marketing, Customer Service, Operations, Analytics). Break down the user's goal into a high-level strategy and assign tasks to these departments. Return a JSON object with a 'strategy' field and a 'delegations' array.";
      
      const response = await this.ai.chat(systemPrompt, goal);
      const content = response.content;
      
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
