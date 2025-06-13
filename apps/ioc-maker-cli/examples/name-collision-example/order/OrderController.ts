import { CreateItemUseCase } from './CreateItemUseCase';
import { UpdateItemUseCase } from './UpdateItemUseCase';
import { DeleteItemUseCase } from './DeleteItemUseCase';
import { GetItemUseCase } from './GetItemUseCase';
import { ListItemsUseCase } from './ListItemsUseCase';

export class OrderController {
  constructor(
    private createItemUseCase: CreateItemUseCase,
    private updateItemUseCase: UpdateItemUseCase,
    private deleteItemUseCase: DeleteItemUseCase,
    private getItemUseCase: GetItemUseCase,
    private listItemsUseCase: ListItemsUseCase
  ) {}

  async createOrderItem(name: string, quantity: number, unitPrice: number): Promise<void> {
    console.log('OrderController: Creating order item...');
    await this.createItemUseCase.execute({ name, quantity, unitPrice });
  }

  async updateOrderItem(id: string, name: string, quantity: number, unitPrice: number): Promise<void> {
    console.log('OrderController: Updating order item...');
    await this.updateItemUseCase.execute(id, { name, quantity, unitPrice });
  }

  async deleteOrderItem(id: string): Promise<void> {
    console.log('OrderController: Deleting order item...');
    await this.deleteItemUseCase.execute(id);
  }

  async getOrderItem(id: string): Promise<{ name: string; quantity: number; unitPrice: number } | null> {
    console.log('OrderController: Getting order item...');
    return await this.getItemUseCase.execute(id);
  }

  async listOrderItems(): Promise<{ id: string; name: string; quantity: number; unitPrice: number }[]> {
    console.log('OrderController: Listing order items...');
    return await this.listItemsUseCase.execute();
  }
}