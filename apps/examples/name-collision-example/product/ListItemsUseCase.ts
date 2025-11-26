// Product module's ListItemsUseCase - lists all product catalog items
export class ListItemsUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(): Promise<{ id: string; name: string; price: number; category: string }[]> {
    console.log('Listing all product items');
    // Logic for listing product-related items
    return await this.productRepository.listProducts();
  }
}

// Interface for product repository
export interface IProductRepository {
  listProducts(): Promise<{ id: string; name: string; price: number; category: string }[]>;
}