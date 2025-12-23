import dotenv from 'dotenv';
import { LiveShopAdapter } from './infra/shop/Shopify/LiveShopAdapter.js';
dotenv.config();
async function testShopify() {
    console.log("🛍️ Testing Shopify Integration...");
    const adapter = new LiveShopAdapter();
    // 1. Test Policy Check (No API required)
    console.log("\n👮 Testing Policy Check...");
    const safeProduct = { name: "Yoga Mat", description: "Eco-friendly yoga mat" };
    const riskyProduct = { name: "Tactical Knife", description: "Sharp steel blade" };
    const check1 = await adapter.checkPolicy(safeProduct.name, safeProduct.description);
    console.log(`   - Checking '${safeProduct.name}': ${check1.allowed ? '✅ Allowed' : '❌ Blocked'}`);
    const check2 = await adapter.checkPolicy(riskyProduct.name, riskyProduct.description);
    console.log(`   - Checking '${riskyProduct.name}': ${check2.allowed ? '✅ Allowed' : '❌ Blocked'} (${check2.reason})`);
    // 2. Test API Connectivity
    console.log("\n🔌 Testing Shopify API Connection...");
    if (!process.env.SHOPIFY_SHOP_NAME || !process.env.SHOPIFY_ACCESS_TOKEN) {
        console.warn("⚠️ SHOPIFY_SHOP_NAME or SHOPIFY_ACCESS_TOKEN missing. Skipping API tests.");
        return;
    }
    try {
        const products = await adapter.listProducts();
        console.log(`✅ Connection Successful! Found ${products.length} products.`);
        products.forEach(p => console.log(`   - [${p.id}] ${p.name} ($${p.price})`));
    }
    catch (error) {
        console.error("❌ API Connection Failed:", error.message);
    }
}
testShopify().catch(console.error);
