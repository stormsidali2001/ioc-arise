// Order module's CreateItemUseCase - creates order items
export class CreateItemUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(itemData: { name: string; quantity: number; unitPrice: number }): Promise<void> {
    console.log(`Creating order item: ${itemData.name}`);
    // Logic for creating order-related items
    await this.orderRepository.saveOrderItem(itemData);
  }
}

// Simple interface for demonstration
export interface IOrderRepository {
  saveOrderItem(item: { name: string; quantity: number; unitPrice: number }): Promise<void>;
  updateOrderItem(id: string, item: { name: string; quantity: number; unitPrice: number }): Promise<void>;
  deleteOrderItem(id: string): Promise<void>;
  getOrderItem(id: string): Promise<{ name: string; quantity: number; unitPrice: number } | null>;
  listOrderItems(): Promise<{ id: string; name: string; quantity: number; unitPrice: number }[]>;
}