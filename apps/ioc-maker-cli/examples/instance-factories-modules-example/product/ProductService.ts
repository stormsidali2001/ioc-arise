import { IUserService } from '../user/IUserService';
import { IProductRepository } from './IProductRepository';
import { IProductService } from './IProductService';

export class ProductService implements IProductService {
  constructor(
    private productRepository: IProductRepository,
    private userService: IUserService,
  ) {}

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

  listProductsForUser(userId: string) {
    const user = this.userService.getUser(userId);
    if (!user) return [];
    return this.productRepository.findAll();
  }
}
