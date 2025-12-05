import { BaseAgent } from './BaseAgent.js';
import { configService } from '../infra/config/ConfigService.js';
export class OperationsAgent extends BaseAgent {
    constructor(db) {
        super('Operations', db);
        this.registerTool('fulfill_order', this.fulfillOrder.bind(this));
        this.registerTool('check_inventory', this.checkInventory.bind(this));
        this.registerTool('handle_shipping_issue', this.handleShippingIssue.bind(this));
    }
    async handleShippingIssue(args) {
        const { order_id, issue_type } = args;
        this.log('warn', `Handling shipping issue for ${order_id}: ${issue_type}`);
        return {
            action: 'reship',
            new_tracking: 'TRK-REPLACEMENT-' + Math.floor(Math.random() * 1000000)
        };
    }
    async fulfillOrder(args) {
        const { order_id } = args;
        if (configService.get('useSimulatedEndpoints')) {
            return this._fulfillOrderMock(order_id);
        }
        else {
            return this._fulfillOrderReal(order_id);
        }
    }
    async _fulfillOrderMock(order_id) {
        this.log('info', `[MOCK] Fulfilling order ${order_id}`);
        return {
            order_id,
            tracking_number: 'TRK' + Math.floor(Math.random() * 1000000),
            status: 'shipped'
        };
    }
    async _fulfillOrderReal(order_id) {
        this.log('info', `[REAL] Fulfilling order ${order_id} via Supplier API`);
        throw new Error("Real Fulfillment API not implemented yet. Switch to mock mode.");
    }
    async checkInventory(args) {
        const { sku } = args;
        this.log('info', `Checking inventory for ${sku}`);
        return { sku, quantity: 150, location: 'Warehouse A' };
    }
}
