import 'dotenv/config';
import { LiveCompetitorAdapter } from './infra/research/Meta/LiveCompetitorAdapter.js';
import axios from 'axios';

async function testCompetitorAdapter() {
    console.log('--- Testing LiveCompetitorAdapter ---');
    const adapter = new LiveCompetitorAdapter();

    // Test 0: Verify Token
    console.log('\n[Test 0] Verify Meta Token');
    try {
        const token = process.env.META_ACCESS_TOKEN;
        const res = await axios.get(`https://graph.facebook.com/v19.0/me?access_token=${token}`);
        console.log('Token is valid. User Name:', res.data.name, 'ID:', res.data.id);
    } catch (error: any) {
        console.error('Token verification failed:', error.response?.data || error.message);
    }

    // Test 1: Analyze Competitors (SERP API)
    console.log('\n[Test 1] Analyze Competitors (Category: "fitness")');
    try {
        const competitors = await adapter.analyzeCompetitors('fitness');
        console.log('Result:', JSON.stringify(competitors, null, 2));
    } catch (error: any) {
        console.error('Error:', error.message);
    }

    // Test 2: Get Competitor Ads (Meta API)
    // Using a known brand that likely has ads
    const testBrand = 'gymshark.com';
    console.log(`\n[Test 2] Get Competitor Ads (Brand: "${testBrand}")`);
    try {
        const ads = await adapter.getCompetitorAds(testBrand);
        console.log(`Found ${ads.length} ads.`);
        if (ads.length > 0) {
            console.log('Sample Ad:', JSON.stringify(ads[0], null, 2));
        }
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

testCompetitorAdapter();
