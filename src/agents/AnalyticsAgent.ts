import { BaseAgent } from './BaseAgent.js';
import { PersistencePort } from '../core/domain/ports/PersistencePort.js';
import { EventBusPort } from '../core/domain/ports/EventBusPort.js';

export class AnalyticsAgent extends BaseAgent {
  constructor(db: PersistencePort, eventBus: EventBusPort) {
    super('Analytics', db, eventBus);
    this.registerTool('generate_report', this.generateReport.bind(this));
    this.registerTool('predict_sales', this.predictSales.bind(this));
  }

  async generate_report(payload: any) {
      const period = payload.period || 'daily';
      this.log('info', `Workflow: Generating ${period} report`);
      
      try {
          const report = await this.generateReport({ period });
          this.log('info', `Report generated: Revenue $${report.revenue}`);
          // Could publish REPORT_GENERATED if needed
      } catch (error: any) {
          this.log('error', `Failed to generate report: ${error.message}`);
      }
  }

  async generateReport(args: { period: string }) {
    const { period } = args;
    this.log('info', `Generating report for ${period}`);
    
    try {
        // Fetch real data from DB (Simulation only for now)
        const orders = await this.db.getOrders('sim');
        const campaigns = await this.db.getCampaigns('sim');
        
        // Calculate Revenue
        const revenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
        
        // Calculate Costs (Ad Spend)
        // Simplified: Sum of budgets of all active campaigns
        // In a real sim, we'd track daily spend. Here we just sum total budget allocated.
        const activeCampaigns = campaigns.filter(c => c.status === 'active');
        const adSpend = activeCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
        
        // Calculate Profit
        // Assuming 30% COGS for products if not specified
        const cogs = revenue * 0.3; 
        const profit = revenue - cogs - adSpend;

        // Find Top Product
        const productSales = new Map<string, number>();
        orders.forEach(o => {
            const current = productSales.get(o.product) || 0;
            productSales.set(o.product, current + (o.amount || 0));
        });
        
        let topProduct = 'None';
        let maxSales = 0;
        for (const [prod, sales] of productSales.entries()) {
            if (sales > maxSales) {
                maxSales = sales;
                topProduct = prod;
            }
        }

        // Campaign Performance
        const campaignStats: any[] = [];
        activeCampaigns.forEach(c => {
            // Estimate revenue per campaign (random distribution for now as orders don't link to campaign ID directly in all cases, 
            // but trafficSimulator DOES link them via 'source' or we can infer)
            // In trafficSimulator: source = `Paid - ${camp.platform}`. 
            // But if multiple campaigns on same platform, it's tricky.
            // Let's assume we can map by product + platform.
            
            const campOrders = orders.filter(o => o.product === c.product && o.source.includes(c.platform));
            const campRevenue = campOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
            const campSpend = c.budget || 0;
            const campProfit = campRevenue - (campRevenue * 0.3) - campSpend; // 30% COGS
            
            campaignStats.push({
                id: c.id,
                platform: c.platform,
                product: c.product,
                revenue: campRevenue,
                spend: campSpend,
                profit: campProfit,
                roi: campSpend > 0 ? (campRevenue - campSpend) / campSpend : 0
            });
        });

        const report = {
            period,
            revenue: Math.round(revenue * 100) / 100,
            costs: Math.round((cogs + adSpend) * 100) / 100,
            profit: Math.round(profit * 100) / 100,
            adSpend: Math.round(adSpend * 100) / 100,
            orders: orders.length,
            top_product: topProduct,
            campaigns: campaignStats
        };

        this.log('info', `Report Generated: Revenue $${report.revenue}, Profit $${report.profit}`);
        return report;

    } catch (e: any) {
        this.log('error', `Failed to generate report: ${e.message}`);
        throw e;
    }
  }

  async predictSales(args: { product: string }) {
    const { product } = args;
    this.log('info', `Predicting sales for ${product}`);
    return {
      product,
      next_month_forecast: 500,
      confidence: '85%'
    };
  }
}
