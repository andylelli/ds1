import { BaseAgent } from './BaseAgent.js';
import { AiPort, ToolDefinition } from '../core/domain/ports/AiPort.js';
import { PersistencePort } from '../core/domain/ports/PersistencePort.js';

import { EventBusPort } from '../core/domain/ports/EventBusPort.js';

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
      name: 'approveSupplier',
      description: 'Approve a supplier.',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Reason for approval' }
        },
        required: ['reason']
      }
    },
    {
      name: 'rejectSupplier',
      description: 'Reject a supplier.',
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

  constructor(db: PersistencePort, eventBus: EventBusPort, ai: AiPort) {
    super('CEO', db, eventBus);
    this.ai = ai;
  }

  public setTeam(team: Team) {
      this.team = team;
  }

  /**
   * Workflow Action: review_product
   * Triggered by: PRODUCT_FOUND
   */
  async review_product(payload: any) {
      const { product } = payload;
      this.log('info', `Workflow: Reviewing product ${product.name}`);

      const systemPrompt = `You are the CEO. Review this product candidate.
      Product: ${JSON.stringify(product)}
      
      Decide if we should sell this. 
      - Approve if margin is high (e.g. > 50%) or potential is High.
      - Reject otherwise.
      `;

      // We only need the approval/rejection tools for this specific task
      const reviewTools = [
          this.aiTools.find(t => t.name === 'approveProduct')!,
          this.aiTools.find(t => t.name === 'rejectProduct')!
      ];

      try {
        const response = await this.ai.chat(systemPrompt, "Please review this product.", reviewTools);

        // Handle Tool Calls
        if (response.toolCalls && response.toolCalls.length > 0) {
            for (const call of response.toolCalls) {
                if (call.name === 'approveProduct') {
                    this.log('info', `Approved product ${product.name}: ${call.arguments.reason}`);
                    // In a real app, we'd save to DB here with status 'APPROVED'
                    await this.eventBus.publish('Product.Approved', { product, reason: call.arguments.reason });
                } else if (call.name === 'rejectProduct') {
                    this.log('info', `Rejected product ${product.name}: ${call.arguments.reason}`);
                }
            }
        } else {
            // Fallback if AI just chats
            this.log('warn', `AI did not make a formal decision for ${product.name}. Response: ${response.content}`);
        }
      } catch (error: any) {
          this.log('error', `Failed to review product: ${error.message}`);
      }
  }

  /**
   * Workflow Action: review_supplier
   * Triggered by: SUPPLIER_FOUND
   */
  async review_supplier(payload: any) {
      const { product, supplier } = payload;
      this.log('info', `Workflow: Reviewing supplier ${supplier.name} for ${product.name}`);

      const systemPrompt = `You are the CEO. Review this supplier candidate.
      Product: ${product.name}
      Supplier: ${JSON.stringify(supplier)}
      
      Decide if we should use this supplier.
      - Approve if rating > 4.5.
      - Reject otherwise.
      `;

      const reviewTools = [
          this.aiTools.find(t => t.name === 'approveSupplier')!,
          this.aiTools.find(t => t.name === 'rejectSupplier')!
      ];

      try {
        const response = await this.ai.chat(systemPrompt, "Please review this supplier.", reviewTools);

        if (response.toolCalls && response.toolCalls.length > 0) {
            for (const call of response.toolCalls) {
                if (call.name === 'approveSupplier') {
                    this.log('info', `Approved supplier ${supplier.name}: ${call.arguments.reason}`);
                    await this.eventBus.publish('Supplier.Approved', { product, supplier, reason: call.arguments.reason });
                } else if (call.name === 'rejectSupplier') {
                    this.log('info', `Rejected supplier ${supplier.name}: ${call.arguments.reason}`);
                }
            }
        } else {
             this.log('warn', `AI did not make a decision for supplier ${supplier.name}.`);
        }
      } catch (error: any) {
          this.log('error', `Failed to review supplier: ${error.message}`);
      }
  }

  async chat(userMessage: string, mode?: string) {
    await this.log('chat_request', { message: userMessage, mode });

    try {
      // 1. Retrieve comprehensive context
      // If mode='simulation', only get sim data; otherwise get live data
      const source = mode === 'simulation' ? 'sim' : 'live';
      
      const [logs, products, orders, campaigns] = await Promise.all([
        this.db.getRecentLogs(50, source),
        this.db.getProducts(source),
        this.db.getOrders(source),
        this.db.getCampaigns(source)
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

      const modeContext = mode === 'simulation' 
        ? '⚠️ SIMULATION MODE: You are reviewing SIMULATION data only (test database). This is separate from live production operations.'
        : '🔴 LIVE MODE: You are reviewing LIVE PRODUCTION data. Real orders, real campaigns, real revenue.';

      // 3. Construct System Prompt
      const systemPrompt = `You are the CEO of a dropshipping company. You have access to the real-time state of your business.
        
        ${modeContext}
        
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
                  // Run in background but log results
                  console.log(`[CEO] Delegating product research to Research team for category: ${tool.arguments.category}`);
                  this.team.research.findWinningProducts({ category: tool.arguments.category })
                    .then((result: any) => {
                      console.log(`[CEO] Research completed. Found ${result?.products?.length || 0} products`);
                    })
                    .catch((err: any) => {
                      console.error('[CEO] Research failed:', err);
                    });
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
  }

  private async rejectProduct(productId: string, reason: string) {
      await this.log('action', { action: 'reject_product', productId, reason });
  }

  async evaluateProduct(product: any): Promise<{ approved: boolean; reason: string }> {
    // In simulation mode, auto-approve for faster progression
    if (this.mode === 'simulation') {
      await this.approveProduct(product.id);
      return { approved: true, reason: "Auto-approved in simulation mode" };
    }
    
    const systemPrompt = "You are a strict CEO. Evaluate the product proposal.";
    const userMessage = `Product: ${product.name}. Description: ${product.description}. Price: ${product.price}. Should we sell this?`;
    
    try {
      // Add 30 second timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('CEO evaluation timeout after 30s')), 30000)
      );
      
      const response = await Promise.race([
        this.ai.chat(systemPrompt, userMessage, this.aiTools),
        timeoutPromise
      ]) as any;

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
