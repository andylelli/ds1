/**
 * Operations Agent
 * 
 * What it does:
 * - Fulfills orders and generates tracking numbers.
 * - Checks inventory levels across warehouses.
 * 
 * Interacts with:
 * - Base Agent Class
 * - Inventory Management Systems (simulated)
 */
import { BaseAgent } from './base.js';
import { config } from '../lib/config.js';

export class OperationsAgent extends BaseAgent {
  constructor() {
    super('Operations');
    this.registerTool('fulfill_order', this.fulfillOrder.bind(this));
    this.registerTool('check_inventory', this.checkInventory.bind(this));
  }

  async fulfillOrder({ order_id }) {
    if (config.get('useSimulatedEndpoints')) {
      return this._fulfillOrderMock(order_id);
    } else {
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
    // TODO: Implement AfterShip or Supplier Fulfillment API
    // return await supplierApi.fulfill({ orderId: order_id });
    
    throw new Error("Real Fulfillment API not implemented yet. Switch to mock mode.");
  }

  async checkInventory({ sku }) {
    this.log('info', `Checking inventory for ${sku}`);
    return { sku, quantity: 150, location: 'Warehouse A' };
  }
}
