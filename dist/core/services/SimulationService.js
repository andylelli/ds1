import { simulateTraffic } from '../domain/environment/trafficSimulator.js';
import { getMarketEvent } from '../domain/environment/marketEvents.js';
import { v4 as uuidv4 } from 'uuid';
export class SimulationService {
    db;
    eventBus;
    agents;
    activityLog;
    stagingService;
    loopInterval = null;
    isRunning = false;
    tickCount = 0;
    pendingRestocks = [];
    currentEvent = null;
    eventDuration = 0;
    constructor(db, eventBus, agents, activityLog, stagingService) {
        this.db = db;
        this.eventBus = eventBus;
        this.agents = agents;
        this.activityLog = activityLog;
        this.stagingService = stagingService;
    }
    async runResearchPhase(category = 'Fitness') {
        console.log(`[Simulation] Starting flow for category: ${category}`);
        // Log simulation start
        console.log('[Simulation] Logging start to ActivityLog...');
        await this.activityLog?.log({
            agent: 'System',
            action: 'simulation_started',
            category: 'system',
            status: 'started',
            message: `Starting simulation for category: ${category}`,
            details: { category }
        });
        console.log('[Simulation] Logged to ActivityLog.');
        // Agents mode is determined by container config, not forced here.
        try {
            console.log('[Simulation] Saving log to DB...');
            await this.db.saveLog('Simulation', 'Flow Started', 'info', { category });
            console.log('[Simulation] Saved log to DB.');
        }
        catch (err) {
            console.error("Failed to log start", err);
        }
        try {
            // 1. Research
            console.log('[Simulation] Logging research start...');
            await this.activityLog?.log({
                agent: 'Research',
                action: 'find_products',
                category: 'research',
                status: 'started',
                message: `Searching for products in ${category}`,
                details: { category }
            });
            console.log('[Simulation] Logged research start.');
            // --- EVENT DRIVEN REFACTOR ---
            // Instead of calling the agent directly, we publish a request.
            // The agent will respond with events (BriefCreated, SignalsCollected, BriefPublished).
            // For now, we will just fire the event. The rest of this method (which chains calls)
            // needs to be broken up in Phase 3/4.
            // However, to keep the simulation running synchronously for now (as per the "Pilot" phase),
            // we might need to wait?
            // Actually, the plan says "Refactor SimulationService: Remove direct calls... Publish events instead."
            // But if we remove the direct call, we don't get `researchResult` back immediately.
            // So the rest of this function (CEO review, etc.) will fail because it depends on `researchResult`.
            // TEMPORARY HYBRID: We publish the event to trigger the agent's new flow,
            // BUT we also keep the direct call for the downstream logic UNTIL we refactor the downstream agents.
            // Wait, that might cause double execution if the agent listens to the event AND we call it.
            // The agent DOES listen to the event now.
            // Correct approach for Phase 2:
            // 1. Publish 'OpportunityResearch.Requested'.
            // 2. The Agent handles it and publishes 'OpportunityResearch.BriefPublished'.
            // 3. We need to SUBSCRIBE to 'OpportunityResearch.BriefPublished' here to continue the flow?
            //    OR, we just stop here and let the other agents pick up from events?
            //    The plan says "Phase 3: Execution Vertical... Sourcing Agent: Update to listen for Research.BriefPublished".
            //    So right now, Sourcing Agent DOES NOT listen.
            // So if I stop calling `findWinningProducts` directly, the chain breaks.
            // I must bridge the gap.
            const requestId = uuidv4();
            console.log(`[Simulation] Publishing OpportunityResearch.Requested: ${requestId}`);
            await this.eventBus.publish('OpportunityResearch.Requested', {
                request_id: requestId,
                criteria: { category }
            });
            // For Phase 3, we have migrated the entire chain:
            // Research -> (BriefPublished) -> Supplier -> (SupplierFound) -> Store -> (PageCreated) -> Marketing
            // We no longer need to manually call the downstream agents.
            // The initial 'OpportunityResearch.Requested' event kicks off the chain.
            return requestId;
        }
        catch (err) {
            console.error("Simulation Error", err);
            throw err;
        }
    }
    async runLaunchPhase(stagedItemId) {
        // Phase 3: This method is now largely obsolete as the flow is event-driven.
        // However, if we want to manually trigger a launch from a staged item (e.g. via UI approval),
        // we should publish an event that the Store/Marketing agents listen to.
        // For now, let's assume the "Approval" event triggers the rest.
        // If we have a "Product.Approved" event, that would be the trigger.
        console.log(`[Simulation] Launching staged item: ${stagedItemId} (Legacy Method - Use Events)`);
    }
    async clearSimulationData() {
        console.log('[SimulationService] Clearing simulation database...');
        await this.db.clearSimulationData();
        // Reset tick count
        this.tickCount = 0;
        this.eventDuration = 0;
        this.currentEvent = null;
        this.pendingRestocks = [];
        console.log('[SimulationService] Reset tick count to 0');
        // Clear activity log
        if (this.activityLog) {
            console.log('[SimulationService] Clearing activity log...');
            try {
                const deleted = await this.activityLog.clearOldLogs(0); // Clear all logs (0 days retention)
                console.log(`[SimulationService] Cleared ${deleted} activity log entries`);
            }
            catch (error) {
                console.error('[SimulationService] Failed to clear activity log:', error);
            }
        }
        console.log('[SimulationService] Simulation database cleared');
    }
    // === Continuous Simulation Loop ===
    startLoop(intervalMs = 10000) {
        if (this.isRunning) {
            console.warn("[Simulation] Loop already running.");
            return;
        }
        console.log(`[Simulation] Starting continuous loop (Interval: ${intervalMs}ms)`);
        this.isRunning = true;
        this.loopInterval = setInterval(() => {
            this.tick().catch(err => console.error("[Simulation] Tick failed:", err));
        }, intervalMs);
    }
    stopLoop() {
        if (this.loopInterval) {
            clearInterval(this.loopInterval);
            this.loopInterval = null;
        }
        this.isRunning = false;
        console.log("[Simulation] Loop stopped.");
    }
    async tick() {
        if (!this.isRunning)
            return;
        // console.log("[Simulation] Tick..."); // Verbose
        try {
            this.tickCount++;
            // console.log(`[Simulation] Tick incremented to: ${this.tickCount}`);
            // 0. Handle Market Events
            if (this.eventDuration > 0) {
                this.eventDuration--;
                if (this.eventDuration === 0) {
                    console.log(`[Simulation] Market Event Ended: ${this.currentEvent?.name}`);
                    this.currentEvent = null;
                }
            }
            else {
                // 10% chance to start a new event if none active
                if (Math.random() < 0.1) {
                    const event = getMarketEvent();
                    if (event) {
                        this.currentEvent = event;
                        this.eventDuration = 10; // Lasts 10 ticks
                        console.log(`[Simulation] New Market Event: ${event.name} (${event.description})`);
                        await this.activityLog?.log({
                            agent: 'System',
                            action: 'market_event',
                            category: 'environment',
                            status: 'started',
                            message: `Market Event: ${event.name}`,
                            details: event
                        });
                    }
                }
            }
            // 0.5 Handle Restocks
            this.pendingRestocks.forEach(r => r.ticksRemaining--);
            const arriving = this.pendingRestocks.filter(r => r.ticksRemaining <= 0);
            this.pendingRestocks = this.pendingRestocks.filter(r => r.ticksRemaining > 0);
            for (const stock of arriving) {
                const products = await this.db.getProducts('sim');
                const p = products.find(prod => prod.id === stock.productId || prod.name === stock.productId); // Handle name vs ID mismatch if any
                if (p) {
                    p.inventory = (p.inventory || 0) + stock.quantity;
                    await this.db.saveProduct(p);
                    console.log(`[Simulation] Restock arrived: ${stock.quantity} units for ${p.name}. New Inventory: ${p.inventory}`);
                    await this.activityLog?.log({
                        agent: 'Supplier',
                        action: 'order_stock',
                        category: 'operations',
                        status: 'completed',
                        entityType: 'product',
                        entityId: p.id,
                        message: `Restock arrived: ${stock.quantity} units. Inventory: ${p.inventory}`
                    });
                }
            }
            // 1. Get Active Campaigns & Products
            const campaigns = await this.db.getCampaigns('sim');
            const activeCampaigns = campaigns.filter(c => c.status === 'active');
            if (activeCampaigns.length === 0) {
                // No active campaigns, nothing to simulate traffic for
                // But we still check for optimization cycle
                if (this.tickCount % 12 === 0) {
                    await this.runOptimizationCycle();
                }
                return;
            }
            const products = await this.db.getProducts('sim');
            // Group campaigns by product
            const productCampaigns = new Map();
            for (const camp of activeCampaigns) {
                if (!productCampaigns.has(camp.product)) {
                    productCampaigns.set(camp.product, []);
                }
                productCampaigns.get(camp.product)?.push(camp);
            }
            // 2. Simulate Traffic for each Product
            for (const [productName, camps] of productCampaigns.entries()) {
                const product = products.find(p => p.name === productName);
                if (!product)
                    continue;
                // Scale = 0.05 (approx 1/20th of a day per tick)
                // If interval is 10s, and we want 1 tick = 1 hour, we need to balance this.
                // Let's assume 1 tick = 1 hour of activity.
                const scale = 0.05;
                const trafficStats = simulateTraffic(product, camps, this.currentEvent, scale);
                if (trafficStats.totalVisitors > 0) {
                    // Check Inventory
                    let currentInventory = product.inventory || 0;
                    const potentialOrders = trafficStats.orders.length;
                    let actualOrders = 0;
                    let missedSales = 0;
                    const processedOrders = [];
                    for (const order of trafficStats.orders) {
                        if (currentInventory > 0) {
                            currentInventory--;
                            actualOrders++;
                            processedOrders.push(order);
                        }
                        else {
                            missedSales++;
                        }
                    }
                    // Update Inventory in DB
                    if (actualOrders > 0) {
                        product.inventory = currentInventory;
                        await this.db.saveProduct(product);
                    }
                    // Auto-Restock Logic (Low Stock Trigger)
                    if (currentInventory < 10 && !this.pendingRestocks.find(r => r.productId === product.id)) {
                        console.log(`[Simulation] Low stock for ${product.name} (${currentInventory}). Ordering more...`);
                        const restockQty = 50;
                        await this.agents.supplier.orderStock({ product_id: product.id, quantity: restockQty });
                        this.pendingRestocks.push({
                            productId: product.id,
                            quantity: restockQty,
                            ticksRemaining: 5 // Arrives in 5 ticks
                        });
                    }
                    console.log(`[Simulation] Tick: ${product.name} - ${trafficStats.totalVisitors} visitors, ${actualOrders} orders, ${missedSales} missed (Inv: ${currentInventory})`);
                    // Save orders
                    for (const order of processedOrders) {
                        await this.db.saveOrder({ ...order, source: 'sim' });
                    }
                    // Log if significant (orders, missed sales, or just traffic)
                    if (actualOrders > 0 || missedSales > 0 || trafficStats.totalVisitors > 0) {
                        const msg = `Tick: ${actualOrders} orders for ${product.name}. Visitors: ${trafficStats.totalVisitors}. Missed: ${missedSales}. Inventory: ${currentInventory}`;
                        await this.db.saveLog('System', 'simulate_traffic', 'info', {
                            visitors: trafficStats.totalVisitors,
                            orders: actualOrders,
                            missed: missedSales,
                            inventory: currentInventory
                        });
                        await this.activityLog?.log({
                            agent: 'System',
                            action: 'simulate_traffic',
                            category: 'operations',
                            status: 'completed',
                            entityType: 'product',
                            entityId: product.id,
                            message: msg,
                            details: {
                                visitors: trafficStats.totalVisitors,
                                orders: actualOrders,
                                missed: missedSales,
                                inventory: currentInventory
                            }
                        });
                    }
                }
            }
            // 3. Optimization Cycle (Every 12 ticks)
            if (this.tickCount % 12 === 0) {
                await this.runOptimizationCycle();
            }
        }
        catch (error) {
            console.error("[Simulation] Error in tick:", error);
        }
    }
    async runOptimizationCycle() {
        console.log("[Simulation] Running Optimization Cycle...");
        await this.db.saveLog('System', 'optimization_cycle', 'info', { message: 'Starting daily optimization cycle' });
        await this.activityLog?.log({
            agent: 'System',
            action: 'optimization_cycle',
            category: 'optimization',
            status: 'started',
            message: 'Starting daily optimization cycle'
        });
        try {
            // 1. Generate Report
            const report = await this.agents.analytics.generateReport({ period: 'daily' });
            console.log(`[Simulation] Optimization Report: Profit $${report.profit}`);
            await this.db.saveLog('Analytics', 'generate_report', 'info', { profit: report.profit, revenue: report.revenue });
            // 2. Analyze Campaigns
            if (report.campaigns && report.campaigns.length > 0) {
                for (const camp of report.campaigns) {
                    // Rule: Kill if profit < -$50 (Loss limit)
                    if (camp.profit < -50) {
                        console.log(`[Simulation] Optimization: Killing campaign ${camp.id} (Loss: $${camp.profit})`);
                        await this.agents.marketing.stopCampaign({ campaign_id: camp.id });
                        const stopMsg = `Stopped campaign ${camp.id} due to poor performance (Profit: $${camp.profit})`;
                        await this.db.saveLog('Marketing', 'stop_campaign', 'warning', { campaignId: camp.id, profit: camp.profit });
                        await this.activityLog?.log({
                            agent: 'Marketing',
                            action: 'stop_campaign',
                            category: 'optimization',
                            status: 'completed',
                            entityType: 'campaign',
                            entityId: camp.id,
                            message: stopMsg,
                            details: { profit: camp.profit, threshold: -50 }
                        });
                    }
                }
            }
        }
        catch (e) {
            console.error("[Simulation] Optimization failed:", e);
            await this.db.saveLog('System', 'optimization_cycle_failed', 'error', { error: e.message });
            await this.activityLog?.log({
                agent: 'System',
                action: 'optimization_cycle',
                category: 'optimization',
                status: 'failed',
                message: `Optimization cycle failed: ${e.message}`,
                details: { error: e.message, stack: e.stack, fullError: JSON.stringify(e, Object.getOwnPropertyNames(e)) }
            });
        }
    }
    getTickCount() {
        return this.tickCount;
    }
    getIsRunning() {
        return this.isRunning;
    }
}
