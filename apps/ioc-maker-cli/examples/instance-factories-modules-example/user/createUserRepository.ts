import { IAppConfig } from '../core/IAppConfig';
import { ILogger } from '../core/ILogger';
import { IUserRepository } from './IUserRepository';

/**
 * Instance factory — separate params.
 * Dependencies (IAppConfig, ILogger) are injected as individual arguments.
 */
export function createUserRepository(
  config: IAppConfig,
  logger: ILogger,
): IUserRepository {
  const store = new Map<string, { id: string; name: string }>();
  const storageType = config.getStorageType();

  logger.info(`UserRepository: initialising with storage="${storageType}"`);

  return {
    findAll: () => Array.from(store.values()),
    findById: (id) => store.get(id) ?? null,
    save: (user) => {
      store.set(user.id, user);
      logger.info(`UserRepository: saved user ${user.id}`);
    },
  };
}
