import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const PAGE_ID = '20531316728'; // Nike's Facebook Page ID (public)

async function testPublicAdLibrary() {
    console.log('--- Testing Meta Ad Library Public Access ---\n');
    if (!ACCESS_TOKEN) {
        console.error('No META_ACCESS_TOKEN set.');
        return;
    }
    try {
        const url = `https://graph.facebook.com/v19.0/ads_archive?access_token=${ACCESS_TOKEN}` +
            `&ad_reached_countries=[\"US\"]&ad_type=POLITICAL_AND_ISSUE_ADS&search_page_ids=${PAGE_ID}&fields=ad_creative_body,ad_creative_link_caption,ad_creative_link_description,ad_creative_link_title,ad_delivery_start_time,ad_delivery_stop_time,ad_snapshot_url,bylines,demographic_distribution,funding_entity,id,page_id,page_name,spend,impressions`;
        const res = await axios.get(url);
        console.log('Response:', JSON.stringify(res.data, null, 2));
    } catch (e: any) {
        if (e.response) {
            console.error('API Error:', e.response.status, e.response.data);
        } else {
            console.error('Error:', e.message);
        }
    }
}

testPublicAdLibrary();
