import { simulateTraffic } from '../domain/environment/trafficSimulator.js';
import { configService } from '../../infra/config/ConfigService.js';
export class SimulationService {
    db;
    agents;
    constructor(db, agents) {
        this.db = db;
        this.agents = agents;
    }
    async runSimulationFlow(category = 'Fitness') {
        console.log(`[Simulation] Starting flow for category: ${category}`);
        // Set all agents to simulation mode
        this.agents.ceo.setMode('simulation');
        this.agents.research.setMode('simulation');
        this.agents.supplier.setMode('simulation');
        this.agents.store.setMode('simulation');
        this.agents.marketing.setMode('simulation');
        try {
            await this.db.saveLog('Simulation', 'Flow Started', 'info', { category });
        }
        catch (err) {
            console.error("Failed to log start", err);
        }
        try {
            // 1. Research
            const researchResult = await this.agents.research.findWinningProducts({ category });
            if (!researchResult || !researchResult.products || researchResult.products.length === 0) {
                console.error("[Simulation] No products found.");
                await this.db.saveLog('Simulation', 'No products found', 'error', {});
                return;
            }
            const productData = researchResult.products[0];
            console.log(`[Simulation] Selected Product: ${productData.name}`);
            // Save initial product state to simulation database
            await this.db.saveProduct({ ...productData, price: 29.99, source: 'sim' });
            // 1.5 CEO Approval
            console.log(`[Simulation] Requesting CEO Approval for: ${productData.name}`);
            const approval = await this.agents.ceo.evaluateProduct(productData);
            console.log(`[Simulation] CEO Approval Response:`, approval);
            if (!approval || !approval.approved) {
                console.log(`[Simulation] CEO Rejected Product: ${approval.reason}`);
                await this.db.saveLog('Simulation', 'Product Rejected by CEO', 'warning', {
                    product: productData.name,
                    reason: approval.reason
                });
                return;
            }
            console.log(`[Simulation] CEO Approved Product: ${approval.reason}`);
            await this.db.saveLog('Simulation', 'Product Approved by CEO', 'success', {
                product: productData.name,
                reason: approval.reason
            });
            // 2. Source
            await this.agents.supplier.findSuppliers({ product_id: productData.id });
            // 3. Build Store
            const page = await this.agents.store.createProductPage({ product_data: productData });
            console.log(`[Simulation] Store Page Created: ${page.url}`);
            // 4. Marketing
            const campaign = await this.agents.marketing.createAdCampaign({
                platform: 'Facebook',
                budget: 100,
                product: productData.name
            });
            if (!campaign) {
                console.error("[Simulation] Campaign creation failed");
                await this.db.saveLog('Simulation', 'Campaign creation failed', 'error', {});
                return;
            }
            console.log(`[Simulation] Campaign Created: ${campaign.campaign_id}`);
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
                }];
            const scale = configService.get('trafficScale') || 1.0;
            const trafficStats = simulateTraffic(simProduct, simCampaigns, null, scale);
            console.log(`[Simulation] Traffic Results: ${trafficStats.totalVisitors} visitors (Scale: ${scale})`);
            // Save orders to simulation database
            for (const order of trafficStats.orders) {
                await this.db.saveOrder({ ...order, source: 'sim' });
            }
            console.log(`[Simulation] Saved ${trafficStats.orders.length} orders to simulation database`);
            // Save campaign to simulation database  
            await this.db.saveCampaign({
                id: campaign.campaign_id,
                platform: 'Facebook',
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
        }
        catch (e) {
            console.error("[Simulation] Flow failed:", e);
            await this.db.saveLog('Simulation', 'Flow Failed', 'error', e.message || e);
        }
        finally {
            // Reset all agents to live mode
            this.agents.ceo.setMode('live');
            this.agents.research.setMode('live');
            this.agents.supplier.setMode('live');
            this.agents.store.setMode('live');
            this.agents.marketing.setMode('live');
        }
    }
    async clearSimulationData() {
        console.log('[SimulationService] Clearing simulation database...');
        await this.db.clearSimulationData();
        console.log('[SimulationService] Simulation database cleared');
    }
}
