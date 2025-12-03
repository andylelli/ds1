/**
 * Store Build Agent
 * 
 * What it does:
 * - Manages the creation of product pages on Shopify.
 * - Optimizes content for SEO.
 * 
 * Interacts with:
 * - Base Agent Class
 * - Shopify Admin API (/src/lib/shopify.js)
 */
import { BaseAgent } from './base.js';
import { getShopifyClient } from '../lib/shopify.js';
import { getOpenAIClient, DEPLOYMENT_NAME } from '../lib/ai.js';

export class StoreBuildAgent extends BaseAgent {
  constructor() {
    super('StoreBuilder');
    this.registerTool('create_product_page', this.createProductPage.bind(this));
    this.registerTool('optimize_seo', this.optimizeSEO.bind(this));
  }

  async createProductPage({ product_data }) {
    this.log('info', `Creating product page for: ${product_data.name}`);
    
    // 1. Generate Description using AI if missing
    let description = product_data.description;
    if (!description) {
      this.log('info', 'Description missing. Generating one using AI...');
      description = await this.generateDescription(product_data.name);
    }

    const shopify = getShopifyClient();
    if (!shopify) {
      this.log('warning', 'Shopify credentials missing. Returning mock data.');
      return {
        url: `/products/${product_data.name.toLowerCase().replace(/ /g, '-')}`,
        status: 'published (mock)',
        generated_description: description
      };
    }

    try {
      const client = new shopify.client.clients.Rest({ session: shopify.session });
      
      // 2. Prepare Images
      const images = product_data.images ? product_data.images.map(url => ({ src: url })) : [];

      const response = await client.post({
        path: 'products',
        data: {
          product: {
            title: product_data.name,
            body_html: description,
            vendor: "DropShip Agent",
            product_type: product_data.category || "General",
            images: images,
            variants: [
              {
                price: product_data.price || "19.99",
                sku: product_data.sku || `SKU-${Date.now()}`
              }
            ]
          },
        },
        type: 'application/json',
      });

      const product = response.body.product;
      this.log('info', `Successfully created Shopify product ID: ${product.id}`);

      return {
        id: product.id,
        url: `https://${shopify.session.shop}/products/${product.handle}`,
        status: 'published'
      };

    } catch (error) {
      this.log('error', `Failed to create product on Shopify: ${error.message}`);
      throw new Error(`Shopify Error: ${error.message}`);
    }
  }

  async generateDescription(productName) {
    try {
      const client = getOpenAIClient();
      const messages = [
        { role: "system", content: "You are an expert e-commerce copywriter. Write a compelling, high-converting product description (HTML format) for the following product. Focus on benefits and emotional hooks." },
        { role: "user", content: productName }
      ];

      const result = await client.chat.completions.create({
        model: DEPLOYMENT_NAME,
        messages: messages,
      });
      
      return result.choices[0].message.content;
    } catch (error) {
      this.log('warning', `AI description generation failed: ${error.message}`);
      return `<strong>${productName}</strong> - A great product.`;
    }
  }

  async optimizeSEO({ page_url }) {
    this.log('info', `Optimizing SEO for: ${page_url}`);
    // SEO optimization logic would go here (e.g., updating meta fields via Shopify API)
    return { score: 95, keywords: ['best gadget', 'buy online'] };
  }
}
