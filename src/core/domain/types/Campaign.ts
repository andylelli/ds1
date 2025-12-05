export interface Campaign {
  id: string;
  platform: 'TikTok' | 'Facebook' | 'Instagram' | 'Google' | 'Other';
  product: string;
  budget: number;
  status: 'active' | 'paused' | 'ended' | 'draft';
  headline?: string;
  image?: string;
  timestamp?: string;
  _db?: 'live' | 'sim';
}
