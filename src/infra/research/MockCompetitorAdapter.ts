import { CompetitorAnalysisPort } from '../../core/domain/ports/CompetitorAnalysisPort.js';

export class MockCompetitorAdapter implements CompetitorAnalysisPort {
  async analyzeCompetitors(category: string): Promise<any> {
    console.log(`[MockResearch] Analyzing competitors for ${category}`);
    return {
      competitionLevel: 'High',
      topCompetitors: [
        { name: 'Competitor A', url: 'http://comp-a.com', marketShare: '15%' },
        { name: 'Competitor B', url: 'http://comp-b.com', marketShare: '10%' }
      ]
    };
  }

  async getCompetitorAds(competitorUrl: string): Promise<any[]> {
    console.log(`[MockResearch] Fetching ads for ${competitorUrl}`);
    return [
      { id: 'ad1', type: 'video', views: 50000 },
      { id: 'ad2', type: 'image', likes: 1200 }
    ];
  }
}
