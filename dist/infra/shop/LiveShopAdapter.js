import { logger } from '../logging/LoggerService.js';
import { ActivityLogService } from '../../core/services/ActivityLogService.js';
import { shopifyService } from './Shopify/ShopifyService.js';
export class LiveShopAdapter {
    activityLog = null;
    // Basic keyword-based policy check
    prohibitedKeywords = [
        'weapon', 'gun', 'knife', 'drug', 'supplement', 'vitamin',
        'adult', 'sex', 'gamble', 'casino', 'tobacco', 'vape', 'alcohol'
    ];
    constructor(pool) {
        if (pool) {
            this.activityLog = new ActivityLogService(pool);
        }
    }
    async logError(action, error, details = {}) {
        console.error(`[LiveShop] ${action} failed:`, error.message);
        if (this.activityLog) {
            await this.activityLog.log({
                agent: 'StoreBuildAgent', // Or 'ShopAdapter'
                action: action,
                category: 'operations',
                status: 'failed',
                message: `Shop Adapter ${action} failed`,
                details: {
                    error: error.message,
                    stack: error.stack,
                    fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
                    ...details
                }
            }).catch(e => console.error('Failed to log Shop error to DB:', e));
        }
    }
    async checkPolicy(productName, description) {
        const text = `${productName} ${description}`.toLowerCase();
        for (const keyword of this.prohibitedKeywords) {
            if (text.includes(keyword)) {
                return {
                    allowed: false,
                    reason: `Contains prohibited keyword: '${keyword}'. Matches Shopify Restricted Items policy.`
                };
            }
        }
        return { allowed: true };
    }
    async createProduct(product) {
        console.log(`[LiveShop] 🔴 Creating product in LIVE STORE: ${product.name}`);
        logger.external('Shopify', 'createProduct', { name: product.name, category: product.category, price: product.price });
        try {
            const { client, session } = shopifyService.getClient();
            if (!client || !session) {
                throw new Error("Shopify Client not initialized. Check SHOPIFY_SHOP_NAME and SHOPIFY_ACCESS_TOKEN.");
            }
            const response = await client.rest.Product.save({
                session: session,
                data: {
                    title: product.name,
                    body_html: product.description,
                    vendor: "DropShip Agent",
                    product_type: product.category,
                    variants: [{
                            price: product.price.toString(),
                            // sku: product.sku // Product type definition might not have sku
                        }]
                }
            });
            // Map response back to Product
            // Note: response is a RestResource, we need to extract data
            // The type definition for Product might need adjustment to match Shopify's ID format (number vs string)
            return {
                ...product,
                id: response.id?.toString() || 'unknown'
            };
        }
        catch (e) {
            logger.external('Shopify', 'createProduct', { name: product.name, error: e.message });
            await this.logError('create_product', e, { product });
            throw e;
        }
    }
    async listProducts() {
        try {
            const { client, session } = shopifyService.getClient();
            if (!client || !session) {
                throw new Error("Shopify Client not initialized.");
            }
            const response = await client.rest.Product.all({
                session: session,
                limit: 10
            });
            const products = response.data.map((p) => ({
                id: p.id.toString(),
                name: p.title,
                description: p.body_html,
                price: parseFloat(p.variants?.[0]?.price || '0'),
                category: p.product_type,
                status: 'active' // Default
            }));
            logger.external('Shopify', 'listProducts', { count: products.length });
            return products;
        }
        catch (e) {
            logger.external('Shopify', 'listProducts', { error: e.message });
            await this.logError('list_products', e);
            throw e;
        }
    }
    async getProduct(id) {
        try {
            const { client, session } = shopifyService.getClient();
            if (!client || !session) {
                throw new Error("Shopify Client not initialized.");
            }
            // Shopify IDs are numbers, but our system uses strings
            const response = await client.rest.Product.find({
                session: session,
                id: parseInt(id)
            });
            if (!response)
                return null;
            const product = {
                id: response.id?.toString() || '',
                name: response.title || '',
                description: response.body_html || '',
                price: parseFloat(response.variants?.[0]?.price || '0'),
                category: response.product_type || '',
                status: 'active'
            };
            logger.external('Shopify', 'getProduct', { id: product.id, name: product.name });
            return product;
        }
        catch (e) {
            logger.external('Shopify', 'getProduct', { id, error: e.message });
            await this.logError('get_product', e, { id });
            throw e;
        }
    }
}
