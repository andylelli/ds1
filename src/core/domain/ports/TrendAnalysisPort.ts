export interface TrendAnalysisPort {
  analyzeTrend(category: string): Promise<any>;
  checkSaturation(productName: string): Promise<any>;
  findProducts(category: string): Promise<any[]>;
}
