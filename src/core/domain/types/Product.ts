export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  margin?: string;
  potential?: string;
  images?: string[];
  tags?: string[];
  timestamp?: string;
  _db?: 'live' | 'sim';
}
