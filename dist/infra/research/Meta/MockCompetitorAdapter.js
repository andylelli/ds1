export class MockCompetitorAdapter {
    async analyzeCompetitors(category) {
        console.log(`[MockResearch] Analyzing competitors for ${category}`);
        return {
            competitionLevel: 'High',
            topCompetitors: [
                { name: 'Competitor A', url: 'http://comp-a.com', marketShare: '15%' },
                { name: 'Competitor B', url: 'http://comp-b.com', marketShare: '10%' }
            ]
        };
    }
    async getCompetitorAds(competitorUrl) {
        console.log(`[MockResearch] Fetching ads for ${competitorUrl}`);
        return [
            { id: 'ad1', type: 'video', views: 50000 },
            { id: 'ad2', type: 'image', likes: 1200 }
        ];
    }
}
