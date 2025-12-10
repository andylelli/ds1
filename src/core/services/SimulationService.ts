import { PersistencePort } from '../domain/ports/PersistencePort.js';
import { ShopPlatformPort } from '../domain/ports/ShopPlatformPort.js';
import { AdsPlatformPort } from '../domain/ports/AdsPlatformPort.js';
import { CEOAgent } from '../../agents/CEOAgent.js';
import { ProductResearchAgent } from '../../agents/ProductResearchAgent.js';
import { SupplierAgent } from '../../agents/SupplierAgent.js';
import { StoreBuildAgent } from '../../agents/StoreBuildAgent.js';
import { MarketingAgent } from '../../agents/MarketingAgent.js';
import { simulateTraffic } from '../domain/environment/trafficSimulator.js';
import { configService } from '../../infra/config/ConfigService.js';
import { ActivityLogService } from './ActivityLogService.js';

export class SimulationService {
  constructor(
    private db: PersistencePort,
    private agents: {
      ceo: CEOAgent;
      research: ProductResearchAgent;
      supplier: SupplierAgent;
      store: StoreBuildAgent;
      marketing: MarketingAgent;
    },
    private activityLog?: ActivityLogService
  ) {}

  async runSimulationFlow(category: string = 'Fitness') {
    console.log(`[Simulation] Starting flow for category: ${category}`);
    
    // Log simulation start
    await this.activityLog?.log({
      agent: 'System',
      action: 'simulation_started',
      category: 'system',
      status: 'started',
      message: `Starting simulation for category: ${category}`,
      details: { category }
    });
    
    // Set all agents to simulation mode
    this.agents.ceo.setMode('simulation');
    this.agents.research.setMode('simulation');
    this.agents.supplier.setMode('simulation');
    this.agents.store.setMode('simulation');
    this.agents.marketing.setMode('simulation');
    
    try {
      await this.db.saveLog('Simulation', 'Flow Started', 'info', { category });
    } catch (err) { console.error("Failed to log start", err); }

    try {
      // 1. Research
      await this.activityLog?.log({
        agent: 'Research',
        action: 'find_products',
        category: 'research',
        status: 'started',
        message: `Searching for products in ${category}`,
        details: { category }
      });

      const researchResult = await this.agents.research.findWinningProducts({ category });
      if (!researchResult || !researchResult.products || researchResult.products.length === 0) {
        console.error("[Simulation] No products found.");
        await this.db.saveLog('Simulation', 'No products found', 'error', {});
        await this.activityLog?.log({
          agent: 'Research',
          action: 'find_products',
          category: 'research',
          status: 'failed',
          message: 'No products found in category',
          details: { category }
        });
        return;
      }
      const productData = researchResult.products[0];
      console.log(`[Simulation] Selected Product: ${productData.name}`);

      await this.activityLog?.log({
        agent: 'Research',
        action: 'find_products',
        category: 'research',
        status: 'completed',
        entityType: 'product',
        entityId: productData.id,
        message: `Found product: ${productData.name}`,
        details: { 
          product: productData.name,
          demandScore: productData.demandScore,
          competitionScore: productData.competitionScore
        }
      });

      // Save initial product state to simulation database
      await this.db.saveProduct({ ...productData, price: 29.99, source: 'sim' });

      // 1.5 CEO Approval
      console.log(`[Simulation] Requesting CEO Approval for: ${productData.name}`);
      await this.activityLog?.log({
        agent: 'CEO',
        action: 'evaluate_product',
        category: 'ceo',
        status: 'started',
        entityType: 'product',
        entityId: productData.id,
        message: `Evaluating product: ${productData.name}`
      });

      const approval = await this.agents.ceo.evaluateProduct(productData);
      console.log(`[Simulation] CEO Approval Response:`, approval);
      
      if (!approval || !approval.approved) {
          console.log(`[Simulation] CEO Rejected Product: ${approval.reason}`);
          await this.db.saveLog('Simulation', 'Product Rejected by CEO', 'warning', { 
              product: productData.name,
              reason: approval.reason 
          });
          await this.activityLog?.log({
            agent: 'CEO',
            action: 'evaluate_product',
            category: 'ceo',
            status: 'completed',
            entityType: 'product',
            entityId: productData.id,
            message: `Rejected product: ${productData.name}`,
            details: { approved: false, reason: approval.reason }
          });
          return;
      }
      console.log(`[Simulation] CEO Approved Product: ${approval.reason}`);
      await this.db.saveLog('Simulation', 'Product Approved by CEO', 'success', { 
          product: productData.name,
          reason: approval.reason 
      });
      await this.activityLog?.log({
        agent: 'CEO',
        action: 'evaluate_product',
        category: 'ceo',
        status: 'completed',
        entityType: 'product',
        entityId: productData.id,
        message: `Approved product: ${productData.name}`,
        details: { approved: true, reason: approval.reason }
      });

      // 2. Source
      await this.activityLog?.log({
        agent: 'Supplier',
        action: 'find_suppliers',
        category: 'sourcing',
        status: 'started',
        entityType: 'product',
        entityId: productData.id,
        message: `Finding suppliers for ${productData.name}`
      });

      await this.agents.supplier.findSuppliers({ product_id: productData.id });

      await this.activityLog?.log({
        agent: 'Supplier',
        action: 'find_suppliers',
        category: 'sourcing',
        status: 'completed',
        entityType: 'product',
        entityId: productData.id,
        message: `Suppliers found for ${productData.name}`
      });

      // 3. Build Store
      await this.activityLog?.log({
        agent: 'Store',
        action: 'create_page',
        category: 'store',
        status: 'started',
        entityType: 'product',
        entityId: productData.id,
        message: `Building product page for ${productData.name}`
      });

      const page = await this.agents.store.createProductPage({ product_data: productData });
      console.log(`[Simulation] Store Page Created: ${page.url}`);

      await this.activityLog?.log({
        agent: 'Store',
        action: 'create_page',
        category: 'store',
        status: 'completed',
        entityType: 'product',
        entityId: productData.id,
        message: `Product page created: ${page.url}`,
        details: { url: page.url }
      });

      // 4. Marketing
      await this.activityLog?.log({
        agent: 'Marketing',
        action: 'create_campaign',
        category: 'marketing',
        status: 'started',
        entityType: 'product',
        entityId: productData.id,
        message: `Creating ad campaign for ${productData.name}`
      });

      const campaign = await this.agents.marketing.createAdCampaign({ 
          platform: 'Facebook', 
          budget: 100, 
          product: productData.name 
      });
      
      if (!campaign) {
          console.error("[Simulation] Campaign creation failed");
          await this.db.saveLog('Simulation', 'Campaign creation failed', 'error', {});
          await this.activityLog?.log({
            agent: 'Marketing',
            action: 'create_campaign',
            category: 'marketing',
            status: 'failed',
            entityType: 'product',
            entityId: productData.id,
            message: `Campaign creation failed for ${productData.name}`
          });
          return;
      }

      console.log(`[Simulation] Campaign Created: ${campaign.campaign_id}`);

      await this.activityLog?.log({
        agent: 'Marketing',
        action: 'create_campaign',
        category: 'marketing',
        status: 'completed',
        entityType: 'campaign',
        entityId: campaign.campaign_id,
        message: `Campaign created: ${campaign.campaign_id}`,
        details: { campaignId: campaign.campaign_id, platform: 'Facebook', budget: 100 }
      });

      // 5. Traffic Simulation
      console.log("[Simulation] Simulating Traffic...");
      // We need the full Product object and Campaign object to run traffic sim
      // Fetch them back to ensure we have IDs and correct types
      const products = await this.db.getProducts('sim');
      const campaigns = await this.db.getCampaigns('sim');

      const targetProduct = products.find(p => p.name === productData.name) || { ...productData, id: 'temp', price: 29.99 };
      const activeCampaigns = campaigns.filter(c => c.product === productData.name);

      // If we just created them, they might be in the mock adapter or DB.
      // For the purpose of this flow, let's construct the objects if not found (e.g. if async DB lag)
      const simProduct = targetProduct;
      const simCampaigns = activeCampaigns.length > 0 ? activeCampaigns : [{ 
          id: campaign.campaign_id, 
          platform: 'Facebook', 
          product: productData.name, 
          budget: 100, 
          status: 'active' 
      } as any];

      const scale = configService.get('trafficScale') || 1.0;
      const trafficStats = simulateTraffic(simProduct, simCampaigns, null, scale);
      console.log(`[Simulation] Traffic Results: ${trafficStats.totalVisitors} visitors (Scale: ${scale})`);
      
      await this.activityLog?.log({
        agent: 'System',
        action: 'simulate_traffic',
        category: 'operations',
        status: 'completed',
        entityType: 'product',
        entityId: productData.id,
        message: `Traffic simulated: ${trafficStats.totalVisitors} visitors, ${trafficStats.orders} orders`,
        details: { 
          visitors: trafficStats.totalVisitors,
          orders: trafficStats.orders,
          scale
        }
      });
      
      // Save orders to simulation database
      for (const order of trafficStats.orders) {
        await this.db.saveOrder({ ...order, source: 'sim' });
      }
      console.log(`[Simulation] Saved ${trafficStats.orders.length} orders to simulation database`);
      
      // Save campaign to simulation database  
      await this.db.saveCampaign({ 
        id: campaign.campaign_id,
        platform: 'Facebook' as any,
        product: productData.name,
        budget: 100,
        status: 'active',
        _db: 'sim'
      });
      
      // Log traffic stats
      await this.db.saveLog('Simulation', 'Traffic Run', 'info', trafficStats);
      
      console.log("[Simulation] Flow Completed Successfully.");
      await this.db.saveLog('Simulation', 'Flow Completed', 'success', { 
          product: productData.name, 
          visitors: trafficStats.totalVisitors,
          orders: trafficStats.orders.length 
      });

    } catch (e: any) {
      console.error("[Simulation] Flow failed:", e);
      await this.db.saveLog('Simulation', 'Flow Failed', 'error', e.message || e);
    } finally {
      // Reset all agents to live mode
      this.agents.ceo.setMode('live');
      this.agents.research.setMode('live');
      this.agents.supplier.setMode('live');
      this.agents.store.setMode('live');
      this.agents.marketing.setMode('live');
    }
  }

  async clearSimulationData(): Promise<void> {
    console.log('[SimulationService] Clearing simulation database...');
    await this.db.clearSimulationData();
    
    // Clear activity log
    if (this.activityLog) {
      console.log('[SimulationService] Clearing activity log...');
      try {
        const deleted = await this.activityLog.clearOldLogs(0); // Clear all logs (0 days retention)
        console.log(`[SimulationService] Cleared ${deleted} activity log entries`);
      } catch (error) {
        console.error('[SimulationService] Failed to clear activity log:', error);
      }
    }
    
    console.log('[SimulationService] Simulation database cleared');
  }
}
