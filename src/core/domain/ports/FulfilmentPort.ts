export interface FulfilmentPort {
  findSuppliers(productId: string): Promise<any>;
  negotiatePrice(supplierId: string, targetPrice: number): Promise<any>;
  placeOrder(order: any): Promise<any>;
}
