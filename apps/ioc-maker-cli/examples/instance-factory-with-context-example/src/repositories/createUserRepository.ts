import { IAppConfig } from '../config/IAppConfig';
import { IUserRepository } from './IUserRepository';

/**
 * Instance factory: provides the appropriate IUserRepository implementation
 * based on the storage type read from the injected config value.
 */
export function createUserRepository(context: { config: IAppConfig }): IUserRepository {
  const storageType = context.config.getStorageType();
  const store = new Map<string, { id: string; name: string }>();

  if (storageType === 'persistent') {
    const dbPath = context.config.getDbPath();
    console.log(`[createUserRepository] Using persistent storage at: ${dbPath}`);

    return {
      findAll: () => Array.from(store.values()),
      findById: (id) => store.get(id) ?? null,
      save: (user) => {
        store.set(user.id, user);
        console.log(`[PersistentStore] Persisted user ${user.id} to ${dbPath}`);
      },
    };
  }

  console.log('[createUserRepository] Using in-memory storage');
  return {
    findAll: () => Array.from(store.values()),
    findById: (id) => store.get(id) ?? null,
    save: (user) => { store.set(user.id, user); },
  };
}
