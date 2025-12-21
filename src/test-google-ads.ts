import 'dotenv/config';
import { LiveAdsAdapter } from './infra/ads/GoogleAds/LiveAdsAdapter.js';

async function testGoogleAds() {
    console.log('--- Testing LiveAdsAdapter ---');
    const adapter = new LiveAdsAdapter();

    // Test 1: Get Keyword Metrics
    const keywords = ['yoga mat', 'dumbbells', 'running shoes'];
    console.log(`\n[Test 1] Get Keyword Metrics for: ${keywords.join(', ')}`);
    try {
        const metrics = await adapter.getKeywordMetrics(keywords);
        console.log('Result:', JSON.stringify(metrics, null, 2));
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

testGoogleAds();
