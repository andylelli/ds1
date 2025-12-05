export interface CompetitorAnalysisPort {
  analyzeCompetitors(category: string): Promise<any>;
  getCompetitorAds(competitorUrl: string): Promise<any[]>;
}
