const EVENTS = [
    {
        name: "Competitor Price War",
        description: "A major competitor slashed prices by 20%.",
        impact: { traffic: 1.0, cr: 0.7, cpc: 1.2 }, // CR drops, CPC rises (competition)
        probability: 0.15
    },
    {
        name: "Viral TikTok Trend",
        description: "The product niche is trending on TikTok!",
        impact: { traffic: 2.5, cr: 1.2, cpc: 0.8 }, // Huge traffic boost, cheaper ads
        probability: 0.10
    },
    {
        name: "Ad Platform Algorithm Update",
        description: "Meta/TikTok updated their algo. Reach is down.",
        impact: { traffic: 0.6, cr: 1.0, cpc: 1.5 }, // Traffic drops, ads get expensive
        probability: 0.20
    },
    {
        name: "Holiday Shopping Season",
        description: "It's Q4! People are in a buying mood.",
        impact: { traffic: 1.5, cr: 1.3, cpc: 1.4 }, // More traffic/sales, but expensive ads
        probability: 0.15
    },
    {
        name: "Supply Chain Crunch",
        description: "Global shipping delays are making headlines.",
        impact: { traffic: 0.9, cr: 0.8, cpc: 1.0 }, // People hesitant to buy
        probability: 0.10
    },
    {
        name: "Influencer Shoutout",
        description: "A micro-influencer mentioned the product organically.",
        impact: { traffic: 1.3, cr: 1.1, cpc: 1.0 }, // Free traffic boost
        probability: 0.10
    }
];
export function getMarketEvent() {
    const rand = Math.random();
    // 5% chance of NO event (Normal day)
    if (rand > 0.95) {
        return null;
    }
    // Otherwise pick a random event
    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    return event;
}
