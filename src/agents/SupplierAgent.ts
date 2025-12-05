import { BaseAgent } from './BaseAgent.js';
import { PersistencePort } from '../core/domain/ports/PersistencePort.js';
import { configService } from '../infra/config/ConfigService.js';

export class SupplierAgent extends BaseAgent {
  constructor(db: PersistencePort) {
    super('SupplierManager', db);
    this.registerTool('find_suppliers', this.findSuppliers.bind(this));
    this.registerTool('negotiate_price', this.negotiatePrice.bind(this));
  }

  async findSuppliers(args: { product_id: string }) {
    const { product_id } = args;
    if (configService.get('useSimulatedEndpoints')) {
      return this._findSuppliersMock(product_id);
    } else {
      return this._findSuppliersReal(product_id);
    }
  }

  async _findSuppliersMock(product_id: string) {
    this.log('info', `[MOCK] Finding suppliers for product: ${product_id}`);
    return {
      suppliers: [
        { id: 's1', name: 'AliExpress Vendor A', rating: 4.8, shippingTime: '12-20 days' },
        { id: 's2', name: 'CJ Dropshipping', rating: 4.9, shippingTime: '8-15 days' }
      ]
    };
  }

  async _findSuppliersReal(product_id: string) {
    this.log('info', `[REAL] Searching AliExpress/CJ API for product: ${product_id}`);
    throw new Error("Real Supplier API not implemented yet. Switch to mock mode.");
  }

  async negotiatePrice(args: { supplier_id: string, target_price: number }) {
    const { supplier_id, target_price } = args;
    this.log('info', `Negotiating with ${supplier_id} for price ${target_price}`);
    return { status: 'success', final_price: target_price * 1.05 }; // Simulated negotiation
  }
}
