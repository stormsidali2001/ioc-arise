import { IProductRepository } from './CreateItemUseCase';

export class ProductRepository implements IProductRepository {
  private items: Map<string, { name: string; price: number; category: string }> = new Map();

  async saveProduct(item: { name: string; price: number; category: string }): Promise<void> {
    console.log(`ProductRepository: Saving product - ${item.name} ($${item.price}) in ${item.category}`);
    const id = Math.random().toString(36).substr(2, 9);
    this.items.set(id, item);
    // Simulate database save
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async updateProduct(id: string, item: { name: string; price: number; category: string }): Promise<void> {
    console.log(`ProductRepository: Updating product ${id} - ${item.name} ($${item.price}) in ${item.category}`);
    this.items.set(id, item);
    // Simulate database update
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async deleteProduct(id: string): Promise<void> {
    console.log(`ProductRepository: Deleting product ${id}`);
    this.items.delete(id);
    // Simulate database delete
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async getProduct(id: string): Promise<{ name: string; price: number; category: string } | null> {
    console.log(`ProductRepository: Getting product ${id}`);
    const item = this.items.get(id);
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, 100));
    return item || null;
  }

  async listProducts(): Promise<{ id: string; name: string; price: number; category: string }[]> {
    console.log('ProductRepository: Listing all products');
    const result = Array.from(this.items.entries()).map(([id, item]) => ({ id, ...item }));
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, 100));
    return result;
  }
}