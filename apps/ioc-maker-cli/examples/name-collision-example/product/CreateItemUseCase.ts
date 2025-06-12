// Product module's CreateItemUseCase - creates product catalog items
export class CreateItemUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(itemData: { name: string; price: number; category: string }): Promise<void> {
    console.log(`Creating product item: ${itemData.name} - $${itemData.price}`);
    // Logic for creating product-related items
    await this.productRepository.saveProduct(itemData);
  }
}

// Simple interface for demonstration
export interface IProductRepository {
  saveProduct(item: { name: string; price: number; category: string }): Promise<void>;
}