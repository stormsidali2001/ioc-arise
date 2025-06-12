import { CreateItemUseCase } from './CreateItemUseCase';

export class ProductController {
  constructor(private createItemUseCase: CreateItemUseCase) {}

  async createProduct(name: string, price: number, category: string): Promise<void> {
    console.log('ProductController: Creating product...');
    await this.createItemUseCase.execute({ name, price, category });
  }
}