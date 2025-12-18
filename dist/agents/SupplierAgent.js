import { BaseAgent } from './BaseAgent.js';
export class SupplierAgent extends BaseAgent {
    fulfilment;
    constructor(db, eventBus, fulfilment) {
        super('SupplierManager', db, eventBus);
        this.fulfilment = fulfilment;
        this.registerTool('find_suppliers', this.findSuppliers.bind(this));
        this.registerTool('negotiate_price', this.negotiatePrice.bind(this));
        this.registerTool('order_stock', this.orderStock.bind(this));
        // Subscribe to Research Handoff
        // In the new flow, we listen for OpportunityResearch.BriefPublished
        this.eventBus.subscribe('OpportunityResearch.BriefPublished', 'SupplierAgent', async (event) => {
            this.log('info', `Received Brief: ${event.payload.brief_id}`);
            await this.handleBriefPublished(event.payload);
        });
    }
    /**
     * Event Handler for OpportunityResearch.BriefPublished
     */
    async handleBriefPublished(payload) {
        const { brief_json } = payload;
        const products = brief_json.products || [];
        for (const product of products) {
            this.log('info', `Finding suppliers for product: ${product.name}`);
            // Reuse existing logic
            const result = await this.fulfilment.findSuppliers(product.id || product.name);
            const suppliers = result.suppliers || [];
            if (suppliers.length > 0) {
                for (const supplier of suppliers) {
                    this.log('info', `Found supplier: ${supplier.name} (Rating: ${supplier.rating})`);
                    // Publish Sourcing.SupplierFound (or Supplier.Found for legacy compat)
                    await this.eventBus.publish('Supplier.Found', { product, supplier });
                }
            }
            else {
                this.log('warn', `No suppliers found for ${product.name}`);
            }
        }
    }
    async orderStock(args) {
        const { product_id, quantity } = args;
        this.log('info', `Ordering ${quantity} units for product ${product_id}`);
        // In a real system, this would call the fulfilment port.
        // For simulation, we return a success message.
        return {
            status: 'ordered',
            product_id,
            quantity,
            estimated_arrival: '5 ticks'
        };
    }
    /**
     * Workflow Action: find_suppliers
     * Triggered by: PRODUCT_APPROVED
     */
    async find_suppliers(payload) {
        const { product } = payload;
        this.log('info', `Workflow: Finding suppliers for approved product ${product.name} (${product.id})`);
        const result = await this.fulfilment.findSuppliers(product.id);
        // Handle the specific return structure of the mock/real adapter
        // Mock returns { suppliers: [] }
        const suppliers = result.suppliers || [];
        if (suppliers.length > 0) {
            for (const supplier of suppliers) {
                this.log('info', `Found supplier: ${supplier.name} (Rating: ${supplier.rating})`);
                await this.eventBus.publish('Supplier.Found', { product, supplier });
            }
        }
        else {
            this.log('warn', `No suppliers found for ${product.name}`);
        }
    }
    async findSuppliers(args) {
        const { product_id } = args;
        this.log('info', `Finding suppliers for product: ${product_id}`);
        return this.fulfilment.findSuppliers(product_id);
    }
    async negotiatePrice(args) {
        const { supplier_id, target_price } = args;
        this.log('info', `Negotiating with ${supplier_id} for price ${target_price}`);
        return this.fulfilment.negotiatePrice(supplier_id, target_price);
    }
}
