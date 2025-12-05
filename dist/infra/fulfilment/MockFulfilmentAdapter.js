export class MockFulfilmentAdapter {
    async findSuppliers(productId) {
        console.log(`[MockFulfilment] Finding suppliers for ${productId}`);
        return {
            suppliers: [
                { id: 's1', name: 'AliExpress Vendor A', rating: 4.8, shippingTime: '12-20 days' },
                { id: 's2', name: 'CJ Dropshipping', rating: 4.9, shippingTime: '8-15 days' }
            ]
        };
    }
    async negotiatePrice(supplierId, targetPrice) {
        console.log(`[MockFulfilment] Negotiating with ${supplierId} for price ${targetPrice}`);
        return { status: 'success', final_price: targetPrice * 1.05 };
    }
    async placeOrder(order) {
        console.log(`[MockFulfilment] Placing order ${order.id}`);
        return { status: 'confirmed', tracking_number: 'MOCK_TRACK_123' };
    }
}
