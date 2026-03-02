import { IUserRepository } from './IUserRepository';

/**
 * @scope singleton
 */
export class UserRepository implements IUserRepository {
  private store = new Map<string, string>();

  findById(id: string): string | null {
    return this.store.get(id) ?? null;
  }

  save(id: string, name: string): void {
    this.store.set(id, name);
  }
}
