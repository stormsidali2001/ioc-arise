// Uses a tsconfig path alias for the interface import
import { IProductRepository } from '@/repositories/IProductRepository';

/**
 * @scope singleton
 */
export class InMemoryProductRepository implements IProductRepository {
  private store = new Map<string, string>();

  findById(id: string): string | null {
    return this.store.get(id) ?? null;
  }

  save(id: string, name: string): void {
    this.store.set(id, name);
  }

  list(): string[] {
    return Array.from(this.store.values());
  }
}
