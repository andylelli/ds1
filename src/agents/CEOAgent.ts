import { BaseAgent } from './BaseAgent.js';
import { AiPort, ToolDefinition } from '../core/domain/ports/AiPort.js';
import { PersistencePort } from '../core/domain/ports/PersistencePort.js';
import { ResearchStagingService } from '../core/services/ResearchStagingService.js';
import { FailureAnalyzer } from '../core/analysis/FailureAnalyzer.js';
import { CurrentStrategy } from '../core/domain/types/StrategyProfile.js';
import { ProductResearchWorkflow } from '../core/domain/workflows/ProductResearchWorkflow.js';

import { EventBusPort } from '../core/domain/ports/EventBusPort.js';

export class CEOAgent extends BaseAgent {
  private ai: AiPort;
  private staging?: ResearchStagingService;
  public team: any;
  
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

  constructor(db: PersistencePort, eventBus: EventBusPort, ai: AiPort, staging?: ResearchStagingService) {
    super('CEO', db, eventBus);
    this.ai = ai;
    this.staging = staging;

    // Subscribe to high-level events
    this.eventBus.subscribe('System.Error', 'CEOAgent', async (event) => {
        this.log('info', `CEO Noticed System Error: ${event.payload.error}`);
    });

    this.eventBus.subscribe('Sales.OrderReceived', 'CEOAgent', async (event) => {
        this.log('info', `CEO Celebrates Order: ${event.payload.order_id} for $${event.payload.total}`);
    });

    // Subscribe to Research Output for Staging
    this.eventBus.subscribe('OpportunityResearch.BriefsPublished', 'CEOAgent', async (event) => {
        this.log('info', `CEO received ${event.payload.brief_count} briefs. Staging for review...`);
        await this.stageBriefs(event.payload);
    });
  }

  private async stageBriefs(payload: any) {
      if (!this.staging) {
          this.log('warn', 'Staging service not available. Skipping staging.');
          return;
      }

      const { briefs, request_id } = payload;
      // Create a session if one doesn't exist, or use request_id as session_id if possible.
      // ResearchStagingService expects a session to exist in DB.
      // We can try to create one or assume one exists.
      // For simplicity, let's create a session for this batch.
      
      try {
          // Check if session exists or create new
          let sessionId = request_id;
          const session = await this.staging.getSession(sessionId);
          
          if (!session) {
             // Create a new session for this batch
             // We need category and researchType. We can infer or use defaults.
             const category = briefs[0]?.opportunity_definition?.category || 'Unknown';
             sessionId = await this.staging.createSession(category, 'automated_research', { mode: 'simulation' });
             this.log('info', `Created new staging session: ${sessionId}`);
          }

          for (const brief of briefs) {
              await this.staging.stageItem(sessionId, {
                  itemType: 'product',
                  name: brief.opportunity_definition.theme_name,
                  description: brief.concept.description,
                  rawData: brief,
                  confidenceScore: Math.round((brief.certainty_score || 0) * 100),
                  source: 'ProductResearchAgent',
                  trendEvidence: brief.market_evidence.trend_signal,
                  status: 'pending'
              });
          }
          this.log('info', `Staged ${briefs.length} items for manual review.`);
      } catch (error: any) {
          this.log('error', `Failed to stage briefs: ${error.message}`);
      }
  }

  public setTeam(team: any) {
      this.team = team;
  }

  /**
   * Ask the CEO to explain the status of a research request.
   * This generates a narrative based on the activity logs.
   */
  public async askAboutProduct(query: string): Promise<string> {
      let requestId = query;
      let productId: string | undefined;
      let productName: string | undefined;

      // 0. Resolve Entity (ID vs Name)
      const isId = query.startsWith('req_') || query.startsWith('prod_') || query.startsWith('opp_');
      
      if (!isId) {
          // Assume it's a product name
          this.log('info', `Searching for product matching name: "${query}"...`);
          const product = await this.db.findProductByName(query);
          if (product) {
              this.log('info', `Found product: ${product.name} (${product.id})`);
              productId = product.id;
              productName = product.name;
              // Try to find the original request ID
              const linkedReqId = await this.db.getRequestIdForProduct(product.id);
              if (linkedReqId) {
                  requestId = linkedReqId;
                  this.log('info', `Traced back to Request ID: ${requestId}`);
              } else {
                  // If no request ID found, we might just have to report on the product logs
                  requestId = product.id; // Fallback to searching by product ID
              }
          } else {
              return `I couldn't find any product matching "${query}". Please check the name or provide a Request ID.`;
          }
      }

      // 1. Fetch logs
      // We cast to any because getActivity is a new method on PersistencePort
      let logs = await (this.db as any).getActivity({ entityId: requestId });
      
      if (!logs || logs.length === 0) {
          // If we failed with requestId, try treating the query as a direct entityId (maybe it was a product ID)
          logs = await (this.db as any).getActivity({ entityId: query });
          if (!logs || logs.length === 0) {
             return `I have no records for ID/Name: ${query}.`;
          }
      }

      // 1b. Recursive Fetch: Look for linked Product IDs
      const linkedProductIds = new Set<string>();
      if (productId) linkedProductIds.add(productId);

      logs.forEach((l: any) => {
          if (l.metadata && l.metadata.productId) {
              linkedProductIds.add(l.metadata.productId);
          }
      });

      if (linkedProductIds.size > 0) {
          this.log('info', `Found linked products: ${Array.from(linkedProductIds).join(', ')}. Fetching additional logs...`);
          for (const pid of linkedProductIds) {
              const productLogs = await (this.db as any).getActivity({ entityId: pid });
              if (productLogs && productLogs.length > 0) {
                  logs = logs.concat(productLogs);
              }
          }
          // Re-sort by timestamp
          logs.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      }

      // 2. Analyze Failures
      const failureAnalysis = FailureAnalyzer.analyze(logs);

      // 2b. Analyze Workflow Progress
      let maxStep = -1;
      const completedSteps: string[] = [];
      
      logs.forEach((l: any) => {
          const msg = (l.message || '').toString();
          ProductResearchWorkflow.forEach(step => {
              if (msg.includes(step.logPattern)) {
                  if (step.id > maxStep) maxStep = step.id;
                  if (!completedSteps.includes(step.name)) completedSteps.push(step.name);
              }
          });
      });

      const currentStepName = maxStep >= 0 ? ProductResearchWorkflow.find(s => s.id === maxStep)?.name : "Initialization";
      const progressPercent = Math.round(((maxStep + 1) / ProductResearchWorkflow.length) * 100);

      // 3. Extract Artifacts (e.g. partial research)
      // We look for logs that might contain useful data even if the process failed later
      const artifacts: any = {};
      logs.forEach((l: any) => {
          if (l.metadata) {
             if (l.metadata.competitors) artifacts.competitors = l.metadata.competitors;
             if (l.metadata.trends) artifacts.trends = l.metadata.trends;
             if (l.metadata.customer_feedback) artifacts.customer_feedback = l.metadata.customer_feedback;
          }
      });

      // 4. Format logs for context
      const logSummary = logs.map((l: any) => `[${l.timestamp}] ${l.action}: ${l.message}`).join('\n');

      // 5. Construct Prompt
      let prompt = `
          You are the CEO. You are reviewing the progress of a product research initiative.
          Here is the activity log for ${productName ? `Product: "${productName}"` : `Request ID: ${requestId}`}.
          
          STRATEGY CONTEXT:
          We are currently focusing on these categories: ${CurrentStrategy.allowed_categories.join(', ')}.
          Our risk tolerance is ${CurrentStrategy.risk_tolerance} and we target a margin of ${(CurrentStrategy.target_margin * 100)}%.
          
          WORKFLOW STATUS:
          Current Phase: ${currentStepName} (Step ${maxStep} of 11)
          Progress: ${progressPercent}%
          Completed Steps: ${completedSteps.join(' -> ')}
          
          LOGS:
          ${logSummary}
      `;

      if (failureAnalysis) {
          prompt += `
          
          CRITICAL ALERT: The research process has FAILED.
          Root Cause: ${failureAnalysis.rootCause}
          Details: ${failureAnalysis.details}
          Recommendation: ${failureAnalysis.recommendation}
          
          Please explain this failure to me clearly. Do not be technical. 
          Explain WHAT went wrong (e.g. "We couldn't find enough data" or "The AI service is down") and what we should do next.
          
          Also, mention which step of the workflow we failed at (${currentStepName}).
          `;
      } else {
          prompt += `
          
          Please provide a cohesive, executive summary of what has happened so far. 
          Tell it as a "Hero's Journey" story. 
          
          Structure:
          1. The Quest (Research): How we started and what we were looking for. Mention the workflow steps we passed (e.g. "We successfully cleared the Gating and Scoring phases...").
          2. The Discovery (Product): What we found (The "Winner") and why it's special.
          3. The Execution (Sourcing/Marketing): What happened after we found it (Supplier negotiations, Ad campaigns).
          4. The Outcome: Current status and next steps.

          Highlight key decisions, findings, and current status.
          `;
      }

      if (Object.keys(artifacts).length > 0) {
          prompt += `
          
          I also found some partial data that was collected before any issues:
          ${JSON.stringify(artifacts, null, 2)}
          
          Please mention these findings if they are relevant, even if the overall process failed.
          `;
      }

      try {
          const response = await this.ai.chat(prompt, "Explain the status.", []);
          return response.content;
      } catch (e: any) {
          return `I tried to analyze the logs but encountered an error: ${e.message}`;
      }
  }

  /**
   * Workflow Action: review_product
   * Triggered by: PRODUCT_FOUND
   */
  async review_product(payload: any) {
      const { product } = payload;
      this.log('info', `Workflow: Reviewing product ${product.name}`);

      // MANUAL OVERRIDE: Auto-approval disabled.
      // The product is now waiting in the staging area (or database) for manual approval via the UI.
      this.log('info', `⏸️ Product ${product.name} is pending manual approval. Auto-approval disabled.`);
      
      /* 
      // --- Legacy Auto-Approval Logic (Disabled) ---
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
      */
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
      return `I apologize, but I'm having trouble accessing my reports right now. (Error: ${error.message})`;
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
