// Order module's GetItemUseCase - retrieves order items
export class GetItemUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(id: string): Promise<{ name: string; quantity: number; unitPrice: number } | null> {
    console.log(`Getting order item: ${id}`);
    // Logic for retrieving order-related items
    return await this.orderRepository.getOrderItem(id);
  }
}

// Interface for order repository
export interface IOrderRepository {
  getOrderItem(id: string): Promise<{ name: string; quantity: number; unitPrice: number } | null>;
}