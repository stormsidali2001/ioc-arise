import { IOrderRepository } from './CreateItemUseCase';

export class OrderRepository implements IOrderRepository {
  async saveOrderItem(item: { name: string; quantity: number; unitPrice: number }): Promise<void> {
    const totalPrice = item.quantity * item.unitPrice;
    console.log(`OrderRepository: Saving order item - ${item.name} (${item.quantity} units @ $${item.unitPrice} each = $${totalPrice})`);
    // Simulate database save
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}