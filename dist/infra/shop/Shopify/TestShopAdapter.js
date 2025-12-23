export class TestShopAdapter {
    async checkPolicy(productName, description) {
        return { allowed: true };
    }
    async createProduct(product) {
        console.log(`[TestShop] Creating product in SHOPIFY DEV STORE: ${product.name}`);
        // Simulate API call to Shopify Dev Store
        return {
            ...product,
            id: `dev_prod_${Date.now()}`,
            timestamp: new Date().toISOString()
        };
    }
    async listProducts() {
        return [];
    }
    async getProduct(id) {
        return null;
    }
}
