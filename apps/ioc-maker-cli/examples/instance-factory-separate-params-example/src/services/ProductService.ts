import { IProductRepository } from '../repositories/IProductRepository';
import { IProductService } from './IProductService';

export class ProductService implements IProductService {
  constructor(private productRepository: IProductRepository) {}

  listProducts() {
    return this.productRepository.findAll();
  }

  getProduct(id: string) {
    return this.productRepository.findById(id);
  }

  addProduct(name: string, price: number) {
    const product = { id: Math.random().toString(36).slice(2), name, price };
    this.productRepository.save(product);
    return product;
  }
}
