import { ShopPlatformPort } from '../../core/domain/ports/ShopPlatformPort.js';
import { Product } from '../../core/domain/types/Product.js';
import { ActivityLogService } from '../../core/services/ActivityLogService.js';
import { Pool } from 'pg';

export class LiveShopAdapter implements ShopPlatformPort {
  private activityLog: ActivityLogService | null = null;

  constructor(pool?: Pool) {
    if (pool) {
      this.activityLog = new ActivityLogService(pool);
    }
  }

  private async logError(action: string, error: any, details: any = {}) {
    console.error(`[LiveShop] ${action} failed:`, error.message);
    if (this.activityLog) {
      await this.activityLog.log({
        agent: 'StoreBuildAgent', // Or 'ShopAdapter'
        action: action,
        category: 'operations',
        status: 'failed',
        message: `Shop Adapter ${action} failed`,
        details: { 
          error: error.message, 
          stack: error.stack, 
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
          ...details
        }
      }).catch(e => console.error('Failed to log Shop error to DB:', e));
    }
  }

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    console.log(`[LiveShop] 🔴 Creating product in LIVE STORE: ${product.name}`);
    try {
        // Real Shopify API call would go here
        throw new Error("Shopify Live API credentials missing.");
    } catch (e: any) {
        await this.logError('create_product', e, { product });
        throw e;
    }
  }

  async listProducts(): Promise<Product[]> {
    try {
        throw new Error("Shopify Live API credentials missing.");
    } catch (e: any) {
        await this.logError('list_products', e);
        throw e;
    }
  }

  async getProduct(id: string): Promise<Product | null> {
    try {
        throw new Error("Shopify Live API credentials missing.");
    } catch (e: any) {
        await this.logError('get_product', e, { id });
        throw e;
    }
  }
}
