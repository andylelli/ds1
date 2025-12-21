import dotenv from 'dotenv';
import { LiveVideoAdapter } from './infra/research/YouTube/LiveVideoAdapter';

dotenv.config();

async function testYouTube() {
    console.log("🎥 Testing YouTube Integration...");

    const adapter = new LiveVideoAdapter();
    const query = "dropshipping products 2025";

    console.log(`\n🔍 Searching for: "${query}"...`);
    const searchResults = await adapter.searchVideos(query, 3);

    if (searchResults.length === 0) {
        console.log("❌ No videos found. Check API Key or Quota.");
        return;
    }

    console.log(`✅ Found ${searchResults.length} videos.`);
    searchResults.forEach(v => console.log(`   - [${v.id}] ${v.title} (${v.channelTitle})`));

    const videoIds = searchResults.map(v => v.id);
    console.log(`\n📊 Fetching details for ${videoIds.length} videos...`);
    
    const details = await adapter.getVideoDetails(videoIds);
    
    details.forEach(d => {
        console.log(`\n   📺 ${d.title}`);
        console.log(`      👁️ Views: ${d.viewCount.toLocaleString()}`);
        console.log(`      👍 Likes: ${d.likeCount.toLocaleString()}`);
        console.log(`      💬 Comments: ${d.commentCount.toLocaleString()}`);
        console.log(`      🏷️ Tags: ${d.tags?.slice(0, 5).join(', ') || 'None'}`);
    });
}

testYouTube().catch(console.error);
