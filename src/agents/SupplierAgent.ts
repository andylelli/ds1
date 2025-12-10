import { BaseAgent } from './BaseAgent.js';
import { PersistencePort } from '../core/domain/ports/PersistencePort.js';
import { EventBusPort } from '../core/domain/ports/EventBusPort.js';
import { FulfilmentPort } from '../core/domain/ports/FulfilmentPort.js';

export class SupplierAgent extends BaseAgent {
  private fulfilment: FulfilmentPort;

  constructor(db: PersistencePort, eventBus: EventBusPort, fulfilment: FulfilmentPort) {
    super('SupplierManager', db, eventBus);
    this.fulfilment = fulfilment;
    this.registerTool('find_suppliers', this.findSuppliers.bind(this));
    this.registerTool('negotiate_price', this.negotiatePrice.bind(this));
  }

  /**
   * Workflow Action: find_suppliers
   * Triggered by: PRODUCT_APPROVED
   */
  async find_suppliers(payload: any) {
      const { product } = payload;
      this.log('info', `Workflow: Finding suppliers for approved product ${product.name} (${product.id})`);

      const result = await this.fulfilment.findSuppliers(product.id);
      
      // Handle the specific return structure of the mock/real adapter
      // Mock returns { suppliers: [] }
      const suppliers = result.suppliers || [];

      if (suppliers.length > 0) {
          for (const supplier of suppliers) {
              this.log('info', `Found supplier: ${supplier.name} (Rating: ${supplier.rating})`);
              await this.eventBus.publish('SUPPLIER_FOUND', 'SUPPLIER_FOUND', { product, supplier });
          }
      } else {
          this.log('warn', `No suppliers found for ${product.name}`);
      }
  }

  async findSuppliers(args: { product_id: string }) {
    const { product_id } = args;
    this.log('info', `Finding suppliers for product: ${product_id}`);
    return this.fulfilment.findSuppliers(product_id);
  }

  async negotiatePrice(args: { supplier_id: string, target_price: number }) {
    const { supplier_id, target_price } = args;
    this.log('info', `Negotiating with ${supplier_id} for price ${target_price}`);
    return this.fulfilment.negotiatePrice(supplier_id, target_price);
  }
}
