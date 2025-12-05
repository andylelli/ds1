import { saveAgentLog, saveProduct, saveOrder, saveAd } from './lib/db.js';
import { simulateTraffic } from './lib/trafficSimulator.js';
import { getMarketEvent } from './lib/marketEvents.js';
import { generateProblemEvents } from './lib/problemEvents.js';
import { EventStore } from './lib/eventbus/EventStore.js';

export async function runProductLifecycle(agents, pgPool) {
  const eventStore = pgPool ? new EventStore(pgPool) : null;

  const log = async (msg, data, topic = 'simulation_log') => {
    console.log(`[Simulation] ${msg}`);
    await saveAgentLog('SimulationDirector', msg, 'info', data);
    
    if (eventStore) {
      await eventStore.publish({
        topic: topic,
        type: 'LOG',
        payload: { message: msg, data }
      });
    }
  };

  try {
    await log("🚀 STARTING PRODUCT LIFECYCLE SIMULATION", {}, 'simulation_lifecycle');

    // --- STEP 0: MARKET ANALYSIS ---
    const marketEvent = getMarketEvent();
    if (marketEvent) {
        await log(`🌍 MARKET EVENT: ${marketEvent.name}`, marketEvent, 'market_event');
        await log(`   > ${marketEvent.description}`, {}, 'market_event');
    } else {
        await log("🌍 Market Conditions: Stable", {}, 'market_event');
    }

    // --- STEP 1: RESEARCH ---
    await log("Step 1: Researching winning products...", {}, 'simulation_step');
    const researchResult = await agents.research.findWinningProducts({ 
      category: "Smart Home", 
      criteria: "High Margin" 
    });
    
    // Mocking the result if the agent returns undefined (in case of error/mock issues)
    const products = researchResult?.products || [
      { id: "p_mock_1", name: "Levitating Plant Pot", potential: "High", margin: "60%" }
    ];
    const winner = products[0];
    // Ensure price is set for simulation
    winner.price = winner.price || 49.99;
    
    await log(`🏆 Winner Found: ${winner.name}`, winner, 'product_found');
    await saveProduct(winner, pgPool); // Save to DB (Sim Pool)

    // --- STEP 2: SOURCING ---
    await log("Step 2: Finding suppliers...", {}, 'simulation_step');
    const supplierResult = await agents.supplier.findSuppliers({ product_id: winner.id });
    const bestSupplier = supplierResult?.suppliers?.[0] || { id: "sup_mock", name: "Mock Supplier" };
    await log(`🤝 Supplier Selected: ${bestSupplier.name}`, bestSupplier, 'supplier_selected');

    // --- STEP 3: STORE BUILD ---
    await log("Step 3: Building product page...", {}, 'simulation_step');
    const pageResult = await agents.store.createProductPage({ 
      product_data: { 
        name: winner.name, 
        description: `The amazing ${winner.name} defies gravity!`,
        price: winner.price 
      } 
    });
    await log(`🏪 Store Page Live: ${pageResult.url}`, pageResult, 'store_created');

    // --- STEP 4: MARKETING ---
    await log("Step 4: Launching ad campaigns...", {}, 'simulation_step');
    
    const platforms = ["TikTok", "Facebook", "Instagram"];
    const activeCampaigns = [];
    
    for (const platform of platforms) {
      const adResult = await agents.marketing.createAdCampaign({ 
        platform: platform, 
        budget: 100, 
        product: winner.name 
      });
      
      await log(`📢 ${platform} Ads Running. Campaign ID: ${adResult.campaign_id}`, adResult, 'marketing_launched');
      
      const campaignData = {
        id: adResult.campaign_id,
        platform: platform,
        product: winner.name,
        budget: 100,
        status: "active",
        headline: platform === 'TikTok' ? `Check out the ${winner.name}!` : `Special Offer: ${winner.name} - 50% OFF`,
        image: winner.images?.[0] || "https://via.placeholder.com/400x600.png?text=Ad+Creative"
      };

      // Save Ad to DB
      await saveAd(campaignData, pgPool);
      activeCampaigns.push(campaignData);
    }

    // --- STEP 5: SALES (Simulated) ---
    await log("Step 5: Simulating customer traffic...", {}, 'simulation_step');
    await new Promise(r => setTimeout(r, 1000)); // Brief pause for effect
    
    const trafficResults = simulateTraffic(winner, activeCampaigns, marketEvent);
    
    await log(`👥 Traffic Report: ${trafficResults.totalVisitors} Visitors generated.`, {}, 'traffic_report');
    
    // Log traffic sources
    for (const logMsg of trafficResults.logs) {
        // Don't spam the main log, just summary or debug
        // await log(`  > ${logMsg}`); 
    }

    if (trafficResults.orders.length > 0) {
        await log(`🎉 SUCCESS! Generated ${trafficResults.orders.length} orders.`, {}, 'sales_success');
        for (const order of trafficResults.orders) {
            await log(`💰 NEW ORDER! ${order.id} ($${order.amount}) via ${order.source}`, order, 'new_order');
            await saveOrder(order, pgPool);
        }
    } else {
        await log("😞 No sales generated this run. (Try improving ads or product)", {}, 'sales_failed');
    }

    // --- STEP 6: FULFILLMENT ---
    if (trafficResults.orders.length > 0) {
        await log("Step 6: Fulfilling orders...", {}, 'simulation_step');
        // Just fulfill the first one for demo purposes, or loop all
        for (const order of trafficResults.orders) {
            const fulfillResult = await agents.ops.fulfillOrder({ order_id: order.id });
            await log(`🚚 Order ${order.id} Shipped. Tracking: ${fulfillResult.tracking_number}`, fulfillResult, 'order_shipped');
        }

        // --- STEP 6.5: POST-SALE ISSUES ---
        await log("Step 6.5: Monitoring for post-sale issues...", {}, 'simulation_step');
        const problems = generateProblemEvents(trafficResults.orders);
        
        if (problems.length > 0) {
            await log(`⚠️ ALERT: ${problems.length} issues detected!`, {}, 'issues_detected');
            
            for (const problem of problems) {
                await log(`   > [${problem.type}] Order ${problem.orderId}: ${problem.description}`, problem, 'issue_detail');
                
                if (problem.agent === 'CustomerService') {
                    const resolution = await agents.support.handleTicket({ 
                        ticket_id: problem.id, 
                        message: `${problem.description} (Order: ${problem.orderId})` 
                    });
                    await log(`   ✅ CS Resolution: ${resolution.response} [Action: ${resolution.action}]`, resolution, 'issue_resolved');
                } else if (problem.agent === 'Operations') {
                    const resolution = await agents.ops.handleShippingIssue({
                        order_id: problem.orderId,
                        issue_type: problem.type
                    });
                    await log(`   ✅ Ops Resolution: Reshipped. New Tracking: ${resolution.new_tracking}`, resolution, 'issue_resolved');
                }
            }
        } else {
            await log("✨ No issues reported. Smooth sailing!", {}, 'simulation_status');
        }

    } else {
        await log("Step 6: Skipped fulfillment (no orders).", {}, 'simulation_step');
    }

    // --- STEP 7: ANALYTICS ---
    await log("Step 7: Generating post-mortem report...", {}, 'simulation_step');
    const report = await agents.analytics.generateReport({ period: "Simulation Run" });
    // Calculate actual revenue from this run
    const revenue = trafficResults.orders.reduce((sum, o) => sum + o.amount, 0);
    report.revenue = revenue;
    report.profit = revenue - (activeCampaigns.length * 100); // Simple profit calc
    
    await log(`📊 Run Summary: Revenue $${report.revenue.toFixed(2)} | Profit $${report.profit.toFixed(2)}`, report, 'simulation_summary');

    await log("✅ SIMULATION COMPLETE", {}, 'simulation_complete');

  } catch (error) {
    await log(`❌ SIMULATION FAILED: ${error.message}`, error, 'simulation_error');
    console.error(error);
  }
}
