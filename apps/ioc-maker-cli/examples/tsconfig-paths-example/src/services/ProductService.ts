// Both imports use tsconfig path aliases
import { IProductRepository } from '@/repositories/IProductRepository';
import { IProductService } from '@/services/IProductService';

/**
 * @scope singleton
 */
export class ProductService implements IProductService {
  constructor(private readonly productRepository: IProductRepository) {}

  getProduct(id: string): string | null {
    return this.productRepository.findById(id);
  }

  addProduct(id: string, name: string): void {
    this.productRepository.save(id, name);
  }

  listProducts(): string[] {
    return this.productRepository.list();
  }
}
