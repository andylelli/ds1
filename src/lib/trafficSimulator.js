
/**
 * Simulates website traffic from various sources (Paid, Organic, Direct).
 * Determines conversion based on platform-specific conversion rates.
 * 
 * @param {Object} product - The product being sold (needs .price and .name)
 * @param {Array} activeCampaigns - List of active ad campaigns
 * @param {Object} marketEvent - Optional market event with impact modifiers
 * @returns {Object} - { totalVisitors, orders: [], logs: [] }
 */
export function simulateTraffic(product, activeCampaigns, marketEvent = null) {
    const sources = [
        { name: 'Direct', baseTraffic: 50, conversionRate: 0.02, variance: 20 },
        { name: 'SEO', baseTraffic: 80, conversionRate: 0.03, variance: 30 }
    ];

    // Apply Market Modifiers
    const modTraffic = marketEvent ? marketEvent.impact.traffic : 1.0;
    const modCR = marketEvent ? marketEvent.impact.cr : 1.0;
    const modCPC = marketEvent ? marketEvent.impact.cpc : 1.0;

    const trafficStreams = [];

    // 1. Calculate Organic Traffic
    sources.forEach(src => {
        const count = Math.floor((src.baseTraffic + Math.floor(Math.random() * src.variance)) * modTraffic);
        trafficStreams.push({
            name: src.name,
            count: count,
            cr: src.conversionRate * modCR
        });
    });

    // 2. Calculate Paid Traffic from Campaigns
    activeCampaigns.forEach(camp => {
        // Simple logic: Traffic = Budget / CPC. 
        // TikTok: Cheap CPC ($0.50), Low CR. Facebook: High CPC ($1.50), High CR.
        let cpc = 1.0;
        let cr = 0.02;

        if (camp.platform === 'TikTok') {
            cpc = 0.40;
            cr = 0.012;
        } else if (camp.platform === 'Facebook') {
            cpc = 1.20;
            cr = 0.035;
        } else if (camp.platform === 'Instagram') {
            cpc = 0.90;
            cr = 0.028;
        }

        // Apply Market Modifiers to Paid Channels
        cpc = cpc * modCPC;
        cr = cr * modCR;

        const visitors = Math.floor(camp.budget / cpc * modTraffic);
        
        trafficStreams.push({
            name: `Paid - ${camp.platform}`,
            count: visitors,
            cr: cr,
            campaignId: camp.id
        });
    });

    // 3. Run Simulation Loop
    const results = {
        totalVisitors: 0,
        orders: [],
        logs: []
    };

    trafficStreams.forEach(stream => {
        results.logs.push(`Traffic Source: ${stream.name} sending ~${stream.count} visitors...`);
        
        for (let i = 0; i < stream.count; i++) {
            results.totalVisitors++;
            
            // Roll for purchase
            if (Math.random() < stream.cr) {
                const orderId = `ORD-${Math.floor(Math.random() * 90000) + 10000}`;
                results.orders.push({
                    id: orderId,
                    source: stream.name,
                    product: product.name,
                    amount: product.price || 49.99,
                    status: 'pending',
                    timestamp: new Date().toISOString()
                });
            }
        }
    });

    return results;
}
