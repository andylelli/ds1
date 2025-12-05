import '@shopify/shopify-api/adapters/node';
import { shopifyApi, ApiVersion } from '@shopify/shopify-api';
export class ShopifyService {
    client = null;
    session = null;
    constructor() {
        this.initClient();
    }
    initClient() {
        const shopName = process.env.SHOPIFY_SHOP_NAME;
        const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
        if (!shopName || !accessToken) {
            console.warn("SHOPIFY_SHOP_NAME or SHOPIFY_ACCESS_TOKEN not set. Shopify integration will fail.");
            return;
        }
        this.client = shopifyApi({
            apiKey: process.env.SHOPIFY_API_KEY || 'dummy_key',
            apiSecretKey: process.env.SHOPIFY_API_SECRET || 'dummy_secret',
            scopes: ['write_products', 'read_products'],
            hostName: shopName,
            apiVersion: ApiVersion.October24,
            isEmbeddedApp: false,
        });
        this.session = { shop: shopName, accessToken };
    }
    getClient() {
        return { client: this.client, session: this.session };
    }
}
export const shopifyService = new ShopifyService();
