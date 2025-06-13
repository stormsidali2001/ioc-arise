// Product module's DeleteItemUseCase - deletes product catalog items
export class DeleteItemUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string): Promise<void> {
    console.log(`Deleting product item: ${id}`);
    // Logic for deleting product-related items
    await this.productRepository.deleteProduct(id);
  }
}

// Interface for product repository
export interface IProductRepository {
  deleteProduct(id: string): Promise<void>;
}