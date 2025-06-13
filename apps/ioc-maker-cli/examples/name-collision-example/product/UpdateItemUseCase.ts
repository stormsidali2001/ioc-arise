// Product module's UpdateItemUseCase - updates product catalog items
export class UpdateItemUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string, itemData: { name: string; price: number; category: string }): Promise<void> {
    console.log(`Updating product item: ${id} - ${itemData.name} - $${itemData.price}`);
    // Logic for updating product-related items
    await this.productRepository.updateProduct(id, itemData);
  }
}

// Interface for product repository
export interface IProductRepository {
  updateProduct(id: string, item: { name: string; price: number; category: string }): Promise<void>;
}