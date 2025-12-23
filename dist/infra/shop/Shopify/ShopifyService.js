import '@shopify/shopify-api/adapters/node';
import { shopifyApi, ApiVersion } from '@shopify/shopify-api';
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";
export class ShopifyService {
    client = null;
    session = null;
    constructor() {
        // Lazy initialization in getClient()
    }
    initClient() {
        const shopName = process.env.SHOPIFY_SHOP_NAME;
        const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
        if (!shopName || !accessToken) {
            // Only warn if we are actually trying to use it and it's missing
            // console.warn("SHOPIFY_SHOP_NAME or SHOPIFY_ACCESS_TOKEN not set. Shopify integration will fail.");
            return;
        }
        this.client = shopifyApi({
            apiKey: process.env.SHOPIFY_API_KEY || 'dummy_key',
            apiSecretKey: process.env.SHOPIFY_API_SECRET || 'dummy_secret',
            scopes: ['write_products', 'read_products'],
            hostName: shopName,
            apiVersion: ApiVersion.October24,
            isEmbeddedApp: false,
            restResources,
        });
        this.session = { shop: shopName, accessToken };
    }
    getClient() {
        if (!this.client) {
            this.initClient();
        }
        return { client: this.client, session: this.session };
    }
}
export const shopifyService = new ShopifyService();
