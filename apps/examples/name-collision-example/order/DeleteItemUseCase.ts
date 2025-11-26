// Order module's DeleteItemUseCase - deletes order items
export class DeleteItemUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(id: string): Promise<void> {
    console.log(`Deleting order item: ${id}`);
    // Logic for deleting order-related items
    await this.orderRepository.deleteOrderItem(id);
  }
}

// Interface for order repository
export interface IOrderRepository {
  deleteOrderItem(id: string): Promise<void>;
}