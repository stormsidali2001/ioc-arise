import { IOrderRepository } from './CreateItemUseCase';

export class OrderRepository implements IOrderRepository {
  private items: Map<string, { name: string; quantity: number; unitPrice: number }> = new Map();

  async saveOrderItem(item: { name: string; quantity: number; unitPrice: number }): Promise<void> {
    const totalPrice = item.quantity * item.unitPrice;
    console.log(`OrderRepository: Saving order item - ${item.name} (${item.quantity} units @ $${item.unitPrice} each = $${totalPrice})`);
    const id = Math.random().toString(36).substr(2, 9);
    this.items.set(id, item);
    // Simulate database save
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async updateOrderItem(id: string, item: { name: string; quantity: number; unitPrice: number }): Promise<void> {
    const totalPrice = item.quantity * item.unitPrice;
    console.log(`OrderRepository: Updating order item ${id} - ${item.name} (${item.quantity} units @ $${item.unitPrice} each = $${totalPrice})`);
    this.items.set(id, item);
    // Simulate database update
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async deleteOrderItem(id: string): Promise<void> {
    console.log(`OrderRepository: Deleting order item ${id}`);
    this.items.delete(id);
    // Simulate database delete
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async getOrderItem(id: string): Promise<{ name: string; quantity: number; unitPrice: number } | null> {
    console.log(`OrderRepository: Getting order item ${id}`);
    const item = this.items.get(id);
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, 100));
    return item || null;
  }

  async listOrderItems(): Promise<{ id: string; name: string; quantity: number; unitPrice: number }[]> {
    console.log('OrderRepository: Listing all order items');
    const result = Array.from(this.items.entries()).map(([id, item]) => ({ id, ...item }));
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, 100));
    return result;
  }
}