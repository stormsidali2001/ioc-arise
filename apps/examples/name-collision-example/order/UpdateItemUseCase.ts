// Order module's UpdateItemUseCase - updates order items
export class UpdateItemUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(id: string, itemData: { name: string; quantity: number; unitPrice: number }): Promise<void> {
    console.log(`Updating order item: ${id} - ${itemData.name}`);
    // Logic for updating order-related items
    await this.orderRepository.updateOrderItem(id, itemData);
  }
}

// Interface for order repository
export interface IOrderRepository {
  updateOrderItem(id: string, item: { name: string; quantity: number; unitPrice: number }): Promise<void>;
}