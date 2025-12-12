import { ActivityLogService } from '../../core/services/ActivityLogService.js';
export class LiveShopAdapter {
    activityLog = null;
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
    async createProduct(product) {
        console.log(`[LiveShop] 🔴 Creating product in LIVE STORE: ${product.name}`);
        try {
            // Real Shopify API call would go here
            throw new Error("Shopify Live API credentials missing.");
        }
        catch (e) {
            await this.logError('create_product', e, { product });
            throw e;
        }
    }
    async listProducts() {
        try {
            throw new Error("Shopify Live API credentials missing.");
        }
        catch (e) {
            await this.logError('list_products', e);
            throw e;
        }
    }
    async getProduct(id) {
        try {
            throw new Error("Shopify Live API credentials missing.");
        }
        catch (e) {
            await this.logError('get_product', e, { id });
            throw e;
        }
    }
}
