import 'dotenv/config';
import axios from 'axios';
async function debugMetaPermissions() {
    console.log('--- Debugging Meta Permissions ---');
    const token = process.env.META_ACCESS_TOKEN;
    if (!token) {
        console.error('Error: META_ACCESS_TOKEN is missing in .env');
        return;
    }
    // 1. Check Token Debug Info (Scopes)
    console.log('\n[Step 1] Checking Token Scopes...');
    try {
        const debugRes = await axios.get(`https://graph.facebook.com/v19.0/debug_token`, {
            params: {
                input_token: token,
                access_token: token // You can inspect a token with itself for basic info
            }
        });
        const data = debugRes.data.data;
        console.log('App ID:', data.app_id);
        console.log('User ID:', data.user_id);
        console.log('Scopes:', data.scopes);
        console.log('Is Valid:', data.is_valid);
    }
    catch (error) {
        console.error('Failed to debug token:', error.response?.data || error.message);
    }
    // 2. List Owned Ad Accounts
    console.log('\n[Step 2] Listing Owned Ad Accounts...');
    try {
        const accountsRes = await axios.get(`https://graph.facebook.com/v19.0/me/adaccounts`, {
            params: {
                access_token: token,
                fields: 'name,account_id,account_status'
            }
        });
        const accounts = accountsRes.data.data;
        console.log(`Found ${accounts.length} ad accounts.`);
        accounts.forEach((acc) => {
            console.log(`- ${acc.name} (ID: ${acc.account_id}) [Status: ${acc.account_status}]`);
        });
        if (accounts.length > 0) {
            console.log('\n[Step 3] Trying to fetch ads from YOUR OWN account (Proof of Concept)...');
            const accountId = accounts[0].id; // e.g., act_12345
            try {
                const adsRes = await axios.get(`https://graph.facebook.com/v19.0/${accountId}/ads`, {
                    params: {
                        access_token: token,
                        limit: 3
                    }
                });
                console.log(`Successfully fetched ${adsRes.data.data.length} ads from your account.`);
            }
            catch (e) {
                console.error('Failed to fetch own ads:', e.response?.data?.error?.message || e.message);
            }
        }
    }
    catch (error) {
        console.error('Failed to list ad accounts:', error.response?.data?.error?.message || error.message);
    }
}
debugMetaPermissions();
