import { BaseAgent } from './BaseAgent.js';
import { PersistencePort } from '../core/domain/ports/PersistencePort.js';
import { FulfilmentPort } from '../core/domain/ports/FulfilmentPort.js';

export class SupplierAgent extends BaseAgent {
  private fulfilment: FulfilmentPort;

  constructor(db: PersistencePort, fulfilment: FulfilmentPort) {
    super('SupplierManager', db);
    this.fulfilment = fulfilment;
    this.registerTool('find_suppliers', this.findSuppliers.bind(this));
    this.registerTool('negotiate_price', this.negotiatePrice.bind(this));
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
