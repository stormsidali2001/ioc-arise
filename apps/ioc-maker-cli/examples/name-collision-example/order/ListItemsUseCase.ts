// Order module's ListItemsUseCase - lists all order items
export class ListItemsUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(): Promise<{ id: string; name: string; quantity: number; unitPrice: number }[]> {
    console.log('Listing all order items');
    // Logic for listing order-related items
    return await this.orderRepository.listOrderItems();
  }
}

// Interface for order repository
export interface IOrderRepository {
  listOrderItems(): Promise<{ id: string; name: string; quantity: number; unitPrice: number }[]>;
}