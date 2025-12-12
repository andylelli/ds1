
import googleTrends from 'google-trends-api';

async function testTrends() {
    console.log("Testing google-trends-api...");

    // Test 1: Interest Over Time (Usually stable)
    console.log("\n--- Testing interestOverTime ('dropshipping') ---");
    try {
        const res1 = await googleTrends.interestOverTime({ keyword: 'dropshipping', geo: 'US' });
        const parsed1 = JSON.parse(res1);
        if (parsed1.default && parsed1.default.timelineData) {
            console.log("SUCCESS: Got timeline data. Points:", parsed1.default.timelineData.length);
            console.log("Sample Data Point:", JSON.stringify(parsed1.default.timelineData[parsed1.default.timelineData.length - 1], null, 2));
        } else {
            console.log("WARNING: Unexpected structure for interestOverTime");
        }
    } catch (e: any) {
        console.error("FAIL: interestOverTime:", e.message);
    }

    // Test 2: Related Queries (Used in our code)
    console.log("\n--- Testing relatedQueries ('dropshipping') ---");
    try {
        const res2 = await googleTrends.relatedQueries({ keyword: 'dropshipping', geo: 'US' });
        const parsed2 = JSON.parse(res2);
        if (parsed2.default && parsed2.default.rankedList) {
            console.log("SUCCESS: Got ranked list.");
            const rising = parsed2.default.rankedList[0]?.rankedKeyword || [];
            const top = parsed2.default.rankedList[1]?.rankedKeyword || [];
            console.log(`Rising queries: ${rising.length}, Top queries: ${top.length}`);
            if (rising.length > 0) {
                console.log("Sample Rising Query:", JSON.stringify(rising[0], null, 2));
            }
        } else {
            console.log("WARNING: Unexpected structure for relatedQueries");
        }
    } catch (e: any) {
        console.error("FAIL: relatedQueries:", e.message);
    }

    // Test 3: Real Time Trends (Failed previously)
    console.log("\n--- Testing realTimeTrends (US) ---");
    try {
        const res3 = await googleTrends.realTimeTrends({ geo: 'US' });
        JSON.parse(res3); // Just check if it parses
        console.log("SUCCESS: realTimeTrends worked (Unexpectedly!)");
    } catch (e: any) {
        console.log("FAIL: realTimeTrends failed as expected (404/HTML).");
    }
}

testTrends();
