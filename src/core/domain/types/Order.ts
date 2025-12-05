export interface Order {
  id: string;
  productId: string;
  productName?: string; // Denormalized for convenience
  amount: number;
  status: 'pending' | 'shipped' | 'delivered' | 'refunded' | 'cancelled';
  source: string;
  customerName?: string;
  timestamp?: string;
  _db?: 'live' | 'sim';
}
