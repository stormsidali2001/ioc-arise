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
  updateProduct(id: string, item: { name: string; price: number; category: string }): Promise<void>;
  deleteProduct(id: string): Promise<void>;
  getProduct(id: string): Promise<{ name: string; price: number; category: string } | null>;
  listProducts(): Promise<{ id: string; name: string; price: number; category: string }[]>;
}