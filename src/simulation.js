import { saveAgentLog, saveProduct, saveOrder, saveAd } from './lib/db.js';

export async function runProductLifecycle(agents) {
  const log = async (msg, data) => {
    console.log(`[Simulation] ${msg}`);
    await saveAgentLog('SimulationDirector', msg, 'info', data);
  };

  try {
    await log("🚀 STARTING PRODUCT LIFECYCLE SIMULATION");

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
        price: 49.99 
      } 
    });
    await log(`🏪 Store Page Live: ${pageResult.url}`, pageResult);

    // --- STEP 4: MARKETING ---
    await log("Step 4: Launching ad campaigns...");
    
    const platforms = ["TikTok", "Facebook", "Instagram"];
    
    for (const platform of platforms) {
      const adResult = await agents.marketing.createAdCampaign({ 
        platform: platform, 
        budget: 100, 
        product: winner.name 
      });
      
      await log(`📢 ${platform} Ads Running. Campaign ID: ${adResult.campaign_id}`, adResult);
      
      // Save Ad to DB
      await saveAd({
        id: adResult.campaign_id,
        platform: platform,
        product: winner.name,
        budget: 100,
        status: "active",
        headline: platform === 'TikTok' ? `Check out the ${winner.name}!` : `Special Offer: ${winner.name} - 50% OFF`,
        image: winner.images?.[0] || "https://via.placeholder.com/400x600.png?text=Ad+Creative"
      });
    }

    // --- STEP 5: SALES (Simulated) ---
    await log("⏳ Waiting for customers...");
    await new Promise(r => setTimeout(r, 1500)); // Artificial delay
    const mockOrderId = "ORD-" + Math.floor(Math.random() * 9999);
    await log(`💰 NEW ORDER RECEIVED! Order ID: ${mockOrderId}`);
    await saveOrder({ id: mockOrderId, product: winner.name, amount: 49.99, status: 'pending' }); // Save to DB

    // --- STEP 6: FULFILLMENT ---
    await log("Step 6: Fulfilling order...");
    const fulfillResult = await agents.ops.fulfillOrder({ order_id: mockOrderId });
    await log(`🚚 Order Shipped. Tracking: ${fulfillResult.tracking_number}`, fulfillResult);

    // --- STEP 7: ANALYTICS ---
    await log("Step 7: Generating post-mortem report...");
    const report = await agents.analytics.generateReport({ period: "Simulation Run" });
    await log(`📊 Profit Report: $${report.profit}`, report);

    await log("✅ SIMULATION COMPLETE");

  } catch (error) {
    await log(`❌ SIMULATION FAILED: ${error.message}`);
    console.error(error);
  }
}
