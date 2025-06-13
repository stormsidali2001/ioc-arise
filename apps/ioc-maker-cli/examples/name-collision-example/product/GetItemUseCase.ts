// Product module's GetItemUseCase - retrieves product catalog items
export class GetItemUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string): Promise<{ name: string; price: number; category: string } | null> {
    console.log(`Getting product item: ${id}`);
    // Logic for retrieving product-related items
    return await this.productRepository.getProduct(id);
  }
}

// Interface for product repository
export interface IProductRepository {
  getProduct(id: string): Promise<{ name: string; price: number; category: string } | null>;
}