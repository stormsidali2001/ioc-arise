import { IProductRepository } from './CreateItemUseCase';

export class ProductRepository implements IProductRepository {
  async saveProduct(item: { name: string; price: number; category: string }): Promise<void> {
    console.log(`ProductRepository: Saving product - ${item.name} ($${item.price}) in ${item.category}`);
    // Simulate database save
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}