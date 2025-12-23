export class MockShopAdapter {
    products = new Map();
    async checkPolicy(productName, description) {
        return { allowed: true };
    }
    async createProduct(productData) {
        const id = `shop_prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newProduct = {
            ...productData,
            id,
            timestamp: new Date().toISOString()
        };
        this.products.set(id, newProduct);
        console.log(`[MockShop] Created product: ${newProduct.name} (${id})`);
        return newProduct;
    }
    async listProducts() {
        return Array.from(this.products.values());
    }
    async getProduct(id) {
        return this.products.get(id) || null;
    }
}
