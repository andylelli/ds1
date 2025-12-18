import { BaseAgent } from './BaseAgent.js';
import { PersistencePort } from '../core/domain/ports/PersistencePort.js';
import { EventBusPort } from '../core/domain/ports/EventBusPort.js';
import { configService } from '../infra/config/ConfigService.js';

export class OperationsAgent extends BaseAgent {
  constructor(db: PersistencePort, eventBus: EventBusPort) {
    super('Operations', db, eventBus);
    this.registerTool('fulfill_order', this.fulfillOrder.bind(this));
    this.registerTool('check_inventory', this.checkInventory.bind(this));
    this.registerTool('handle_shipping_issue', this.handleShippingIssue.bind(this));
  }

  async process_order(payload: any) {
      const order = payload.order || payload;
      this.log('info', `Workflow: Processing order ${order.id}`);
      
      try {
          const result = await this.fulfillOrder({ order_id: order.id });
          this.log('info', `Order fulfilled: ${result.tracking_number}`);
          await this.eventBus.publish('Sales.OrderShipped', { order, tracking: result.tracking_number });
      } catch (error: any) {
          this.log('error', `Failed to process order: ${error.message}`);
      }
  }

  async handleShippingIssue(args: { order_id: string, issue_type: string }) {
    const { order_id, issue_type } = args;
    this.log('warn', `Handling shipping issue for ${order_id}: ${issue_type}`);
    return {
        action: 'reship',
        new_tracking: 'TRK-REPLACEMENT-' + Math.floor(Math.random() * 1000000)
    };
  }

  async fulfillOrder(args: { order_id: string }): Promise<{ order_id: string; tracking_number: string; status: string; }> {
    const { order_id } = args;
    if (configService.get('useSimulatedEndpoints')) {
      return this._fulfillOrderMock(order_id);
    } else {
      return this._fulfillOrderReal(order_id);
    }
  }

  async _fulfillOrderMock(order_id: string): Promise<{ order_id: string; tracking_number: string; status: string; }> {
    this.log('info', `Fulfilling order ${order_id}`);
    return {
      order_id,
      tracking_number: 'TRK' + Math.floor(Math.random() * 1000000),
      status: 'shipped'
    };
  }

  async _fulfillOrderReal(order_id: string): Promise<{ order_id: string; tracking_number: string; status: string; }> {
    this.log('info', `[REAL] Fulfilling order ${order_id} via Supplier API`);
    throw new Error("Real Fulfillment API not implemented yet. Switch to mock mode.");
  }

  async checkInventory(args: { sku: string }) {
    const { sku } = args;
    this.log('info', `Checking inventory for ${sku}`);
    return { sku, quantity: 150, location: 'Warehouse A' };
  }
}
