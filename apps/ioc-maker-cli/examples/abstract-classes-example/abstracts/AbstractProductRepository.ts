import { Product } from '../entities/Product';

export abstract class AbstractProductRepository {
  protected abstract tableName: string;
  
  abstract findById(id: string): Promise<Product | null>;
  abstract findByUserId(userId: string): Promise<Product[]>;
  abstract save(product: Product): Promise<Product>;
  abstract delete(id: string): Promise<boolean>;
  
  protected log(message: string): void {
    console.log(`[${this.tableName}] ${message}`);
  }
}