import { ShopManagementPort } from '../../../core/domain/ports/ShopManagementPort.js';
import { Product } from '../../../core/domain/types/Product.js';
import { ActivityLogService } from '../../../core/services/ActivityLogService.js';
import { Pool } from 'pg';
import { shopifyService } from './ShopifyService.js';
import { logger } from '../../logging/LoggerService.js';

export class LiveShopAdapter implements ShopManagementPort {
  private activityLog: ActivityLogService | null = null;
  
  // Basic keyword-based policy check
  private prohibitedKeywords = [
    'weapon', 'gun', 'knife', 'drug', 'supplement', 'vitamin', 
    'adult', 'sex', 'gamble', 'casino', 'tobacco', 'vape', 'alcohol'
  ];

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

  async checkPolicy(productName: string, description: string): Promise<{ allowed: boolean; reason?: string }> {
    const text = `${productName} ${description}`.toLowerCase();
    
    for (const keyword of this.prohibitedKeywords) {
        if (text.includes(keyword)) {
            return { 
                allowed: false, 
                reason: `Contains prohibited keyword: '${keyword}'. Matches Shopify Restricted Items policy.` 
            };
        }
    }

    return { allowed: true };
  }

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    console.log(`[LiveShop] 🔴 Creating product in LIVE STORE: ${product.name}`);
    try {
      const { client, session } = shopifyService.getClient();
      logger.external('Shopify', 'createProduct', { endpoint: 'ShopifyAPI', product });
      if (!client || !session) {
        logger.external('Shopify', 'createProduct', { endpoint: 'ShopifyAPI', error: 'Client not initialized' });
        if (this.activityLog) {
          await this.activityLog.log({
            agent: 'StoreBuildAgent',
            action: 'create_product',
            category: 'operations',
            status: 'failed',
            message: 'Shopify client not initialized',
            details: { product }
          });
        }
        throw new Error("Shopify Client not initialized. Check SHOPIFY_SHOP_NAME and SHOPIFY_ACCESS_TOKEN.");
      }
      const response = await client.rest.Product.save({
        session: session,
        data: {
          title: product.name,
          body_html: product.description,
          vendor: "DropShip Agent",
          product_type: product.category,
          variants: [{
            price: product.price.toString(),
          }]
        }
      });
      logger.external('Shopify', 'createProduct', { endpoint: 'ShopifyAPI', response });
      if (this.activityLog) {
        await this.activityLog.log({
          agent: 'StoreBuildAgent',
          action: 'create_product',
          category: 'operations',
          status: 'completed',
          message: 'Product created',
          details: { product, response }
        });
      }
      return {
        ...product,
        id: response.id?.toString() || 'unknown'
      };
    } catch (e: any) {
      logger.external('Shopify', 'createProduct', { endpoint: 'ShopifyAPI', error: e.message, product });
      await this.logError('create_product', e, { product });
      throw e;
    }
  }

  async listProducts(): Promise<Product[]> {
    try {
      const { client, session } = shopifyService.getClient();
      logger.external('Shopify', 'listProducts', { endpoint: 'ShopifyAPI' });
      if (!client || !session) {
        logger.external('Shopify', 'listProducts', { endpoint: 'ShopifyAPI', error: 'Client not initialized' });
        if (this.activityLog) {
          await this.activityLog.log({
            agent: 'StoreBuildAgent',
            action: 'list_products',
            category: 'operations',
            status: 'failed',
            message: 'Shopify client not initialized',
            details: {}
          });
        }
        throw new Error("Shopify Client not initialized.");
      }
      const response = await client.rest.Product.all({
        session: session,
        limit: 10
      });
      logger.external('Shopify', 'listProducts', { endpoint: 'ShopifyAPI', response });
      if (this.activityLog) {
        await this.activityLog.log({
          agent: 'StoreBuildAgent',
          action: 'list_products',
          category: 'operations',
          status: 'completed',
          message: 'Products listed',
          details: { response }
        });
      }
      return response.data.map((p: any) => ({
        id: p.id.toString(),
        name: p.title,
        description: p.body_html,
        price: parseFloat(p.variants?.[0]?.price || '0'),
        category: p.product_type,
        status: 'active'
      }));
    } catch (e: any) {
      logger.external('Shopify', 'listProducts', { endpoint: 'ShopifyAPI', error: e.message });
      await this.logError('list_products', e);
      throw e;
    }
  }

  async getProduct(id: string): Promise<Product | null> {
    try {
      const { client, session } = shopifyService.getClient();
      logger.external('Shopify', 'getProduct', { endpoint: 'ShopifyAPI', id });
      if (!client || !session) {
        logger.external('Shopify', 'getProduct', { endpoint: 'ShopifyAPI', error: 'Client not initialized', id });
        if (this.activityLog) {
          await this.activityLog.log({
            agent: 'StoreBuildAgent',
            action: 'get_product',
            category: 'operations',
            status: 'failed',
            message: 'Shopify client not initialized',
            details: { id }
          });
        }
        throw new Error("Shopify Client not initialized.");
      }
      const response = await client.rest.Product.find({
        session: session,
        id: parseInt(id)
      });
      logger.external('Shopify', 'getProduct', { endpoint: 'ShopifyAPI', response });
      if (this.activityLog) {
        await this.activityLog.log({
          agent: 'StoreBuildAgent',
          action: 'get_product',
          category: 'operations',
          status: 'completed',
          message: 'Product fetched',
          details: { id, response }
        });
      }
      if (!response) return null;
      return {
        id: response.id?.toString() || '',
        name: response.title || '',
        description: response.body_html || '',
        price: parseFloat(response.variants?.[0]?.price || '0'),
        category: response.product_type || '',
        status: 'active'
      };
    } catch (e: any) {
      logger.external('Shopify', 'getProduct', { endpoint: 'ShopifyAPI', error: e.message, id });
      await this.logError('get_product', e, { id });
      throw e;
    }
  }
}
