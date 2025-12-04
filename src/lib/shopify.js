/**
 * Shopify Client Configuration
 * 
 * What it does:
 * - Configures and exports the Shopify API client.
 * - Manages authentication using the Admin API Access Token.
 * 
 * Interacts with:
 * - Shopify Admin API
 * - StoreBuildAgent
 */
import '@shopify/shopify-api/adapters/node';
import { shopifyApi, ApiVersion } from '@shopify/shopify-api';

let shopifyClient = null;

export function getShopifyClient() {
  if (shopifyClient) return shopifyClient;

  const shopName = process.env.SHOPIFY_SHOP_NAME;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!shopName || !accessToken) {
    console.warn("SHOPIFY_SHOP_NAME or SHOPIFY_ACCESS_TOKEN not set. Shopify integration will fail.");
    return null;
  }

  shopifyClient = shopifyApi({
    apiKey: process.env.SHOPIFY_API_KEY || 'dummy_key', // Not always needed for Admin API access token
    apiSecretKey: process.env.SHOPIFY_API_SECRET || 'dummy_secret',
    scopes: ['write_products', 'read_products'],
    hostName: shopName,
    apiVersion: ApiVersion.October24,
    isEmbeddedApp: false,
  });

  return { client: shopifyClient, session: { shop: shopName, accessToken } };
}
