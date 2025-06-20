import { AbstractRepository } from '../abstracts/AbstractRepository';
import { Product } from '../entities/Product';

export class ProductRepository extends AbstractRepository {
  protected tableName = 'products';
  private products: Product[] = [];
  
  async findById(id: string): Promise<Product | null> {
    this.log(`Finding product by ID: ${id}`);
    return this.products.find(product => product.id === id) || null;
  }
  
  async findByUserId(userId: string): Promise<Product[]> {
    this.log(`Finding products by user ID: ${userId}`);
    return this.products.filter(product => product.userId === userId);
  }
  
  async save(product: Product): Promise<Product> {
    this.log(`Saving product: ${product.name}`);
    const existingIndex = this.products.findIndex(p => p.id === product.id);
    
    if (existingIndex >= 0) {
      this.products[existingIndex] = { ...product, updatedAt: new Date() };
      return this.products[existingIndex];
    } else {
      const newProduct = { ...product, createdAt: new Date(), updatedAt: new Date() };
      this.products.push(newProduct);
      return newProduct;
    }
  }
  
  async delete(id: string): Promise<boolean> {
    this.log(`Deleting product: ${id}`);
    const initialLength = this.products.length;
    this.products = this.products.filter(product => product.id !== id);
    return this.products.length < initialLength;
  }
}