import { CreateItemUseCase } from './CreateItemUseCase';

export class OrderController {
  constructor(private createItemUseCase: CreateItemUseCase) {}

  async createOrderItem(name: string, quantity: number, unitPrice: number): Promise<void> {
    console.log('OrderController: Creating order item...');
    await this.createItemUseCase.execute({ name, quantity, unitPrice });
  }
}