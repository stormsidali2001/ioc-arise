import { AbstractProductRepository } from '../abstracts/AbstractProductRepository';
import { AbstractUserRepository } from '../abstracts/AbstractUserRepository';
import { Product } from '../entities/Product';
import { User } from '../entities/User';
import { InternalProductNestedUseCase } from './InternalProductNestedUseCase';

export class ProductUseCase {
  constructor(
    private productRepository: AbstractProductRepository,
    private userRepository: AbstractUserRepository, // Cross-module dependency,
    private internalNestedUseCase: InternalProductNestedUseCase
  ) {}

  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    // Validate that the user exists before creating the product
    const user = await this.userRepository.findById(productData.userId);
    if (!user) {
      throw new Error(`User with ID ${productData.userId} not found`);
    }

    const product: Product = {
      id: Math.random().toString(36).substr(2, 9),
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return await this.productRepository.save(product);
  }

  async getProductById(id: string): Promise<Product | null> {
    return await this.productRepository.findById(id);
  }

  async getProductsByUserId(userId: string): Promise<Product[]> {
    return await this.productRepository.findByUserId(userId);
  }

  async getProductWithUser(productId: string): Promise<{ product: Product; user: User } | null> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      return null;
    }

    const user = await this.userRepository.findById(product.userId);
    if (!user) {
      throw new Error(`User with ID ${product.userId} not found`);
    }

    return { product, user };
  }

  async updateProduct(product: Product): Promise<Product> {
    // Validate that the user exists
    const user = await this.userRepository.findById(product.userId);
    if (!user) {
      throw new Error(`User with ID ${product.userId} not found`);
    }

    return await this.productRepository.save(product);
  }

  async deleteProduct(id: string): Promise<boolean> {
    return await this.productRepository.delete(id);
  }
}