import { IUserRepository } from './IUserRepository';

/**
 * Instance factory: provides an IUserRepository implementation using in-memory storage.
 * The explicit return type makes this an implementation provider for IUserRepository.
 */
export function createInMemoryUserRepository(): IUserRepository {
  const store = new Map<string, { id: string; name: string }>();

  return {
    async findAll() {
      return Array.from(store.values());
    },
    async findById(id: string) {
      return store.get(id) ?? null;
    },
    async save(user: { id: string; name: string }) {
      store.set(user.id, user);
    },
  };
}
