import { saveAgentLog, saveProduct, saveOrder, saveAd } from './lib/db.js';
import { simulateTraffic } from './lib/trafficSimulator.js';
import { getMarketEvent } from './lib/marketEvents.js';

export async function runProductLifecycle(agents) {
  const log = async (msg, data) => {
    console.log(`[Simulation] ${msg}`);
    await saveAgentLog('SimulationDirector', msg, 'info', data);
  };

  try {
    await log("🚀 STARTING PRODUCT LIFECYCLE SIMULATION");

    // --- STEP 0: MARKET ANALYSIS ---
    const marketEvent = getMarketEvent();
    if (marketEvent) {
        await log(`🌍 MARKET EVENT: ${marketEvent.name}`, marketEvent);
        await log(`   > ${marketEvent.description}`);
    } else {
        await log("🌍 Market Conditions: Stable");
    }

    // --- STEP 1: RESEARCH ---
    await log("Step 1: Researching winning products...");
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
    
    await log(`🏆 Winner Found: ${winner.name}`, winner);
    await saveProduct(winner); // Save to DB

    // --- STEP 2: SOURCING ---
    await log("Step 2: Finding suppliers...");
    const supplierResult = await agents.supplier.findSuppliers({ product_id: winner.id });
    const bestSupplier = supplierResult?.suppliers?.[0] || { id: "sup_mock", name: "Mock Supplier" };
    await log(`🤝 Supplier Selected: ${bestSupplier.name}`, bestSupplier);

    // --- STEP 3: STORE BUILD ---
    await log("Step 3: Building product page...");
    const pageResult = await agents.store.createProductPage({ 
      product_data: { 
        name: winner.name, 
        description: `The amazing ${winner.name} defies gravity!`,
        price: winner.price 
      } 
    });
    await log(`🏪 Store Page Live: ${pageResult.url}`, pageResult);

    // --- STEP 4: MARKETING ---
    await log("Step 4: Launching ad campaigns...");
    
    const platforms = ["TikTok", "Facebook", "Instagram"];
    const activeCampaigns = [];
    
    for (const platform of platforms) {
      const adResult = await agents.marketing.createAdCampaign({ 
        platform: platform, 
        budget: 100, 
        product: winner.name 
      });
      
      await log(`📢 ${platform} Ads Running. Campaign ID: ${adResult.campaign_id}`, adResult);
      
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
      await saveAd(campaignData);
      activeCampaigns.push(campaignData);
    }

    // --- STEP 5: SALES (Simulated) ---
    await log("Step 5: Simulating customer traffic...");
    await new Promise(r => setTimeout(r, 1000)); // Brief pause for effect
    
    const trafficResults = simulateTraffic(winner, activeCampaigns, marketEvent);
    
    await log(`👥 Traffic Report: ${trafficResults.totalVisitors} Visitors generated.`);
    
    // Log traffic sources
    for (const logMsg of trafficResults.logs) {
        // Don't spam the main log, just summary or debug
        // await log(`  > ${logMsg}`); 
    }

    if (trafficResults.orders.length > 0) {
        await log(`🎉 SUCCESS! Generated ${trafficResults.orders.length} orders.`);
        for (const order of trafficResults.orders) {
            await log(`💰 NEW ORDER! ${order.id} ($${order.amount}) via ${order.source}`);
            await saveOrder(order);
        }
    } else {
        await log("😞 No sales generated this run. (Try improving ads or product)");
    }

    // --- STEP 6: FULFILLMENT ---
    if (trafficResults.orders.length > 0) {
        await log("Step 6: Fulfilling orders...");
        // Just fulfill the first one for demo purposes, or loop all
        for (const order of trafficResults.orders) {
            const fulfillResult = await agents.ops.fulfillOrder({ order_id: order.id });
            await log(`🚚 Order ${order.id} Shipped. Tracking: ${fulfillResult.tracking_number}`, fulfillResult);
        }
    } else {
        await log("Step 6: Skipped fulfillment (no orders).");
    }

    // --- STEP 7: ANALYTICS ---
    await log("Step 7: Generating post-mortem report...");
    const report = await agents.analytics.generateReport({ period: "Simulation Run" });
    // Calculate actual revenue from this run
    const revenue = trafficResults.orders.reduce((sum, o) => sum + o.amount, 0);
    report.revenue = revenue;
    report.profit = revenue - (activeCampaigns.length * 100); // Simple profit calc
    
    await log(`📊 Run Summary: Revenue $${report.revenue.toFixed(2)} | Profit $${report.profit.toFixed(2)}`, report);

    await log("✅ SIMULATION COMPLETE");

  } catch (error) {
    await log(`❌ SIMULATION FAILED: ${error.message}`);
    console.error(error);
  }
}
