import { IAppConfig } from '../config/IAppConfig';
import { ILogger } from '../logger/ILogger';
import { IProductRepository } from './IProductRepository';

/**
 * Instance factory with separate params: returns the right IProductRepository
 * implementation based on the storage type in config, logging the decision.
 */
export function createProductRepository(
  config: IAppConfig,
  logger: ILogger,
): IProductRepository {
  const storageType = config.getStorageType();
  const store = new Map<string, { id: string; name: string; price: number }>();

  if (storageType === 'persistent') {
    const dbPath = config.getDbPath();
    logger.info(`ProductRepository: using persistent storage at ${dbPath}`);

    return {
      findAll: () => Array.from(store.values()),
      findById: (id) => store.get(id) ?? null,
      save: (product) => {
        store.set(product.id, product);
        logger.info(`ProductRepository: persisted product ${product.id} to ${dbPath}`);
      },
    };
  }

  logger.info('ProductRepository: using in-memory storage');
  return {
    findAll: () => Array.from(store.values()),
    findById: (id) => store.get(id) ?? null,
    save: (product) => {
      store.set(product.id, product);
      logger.info(`ProductRepository: saved product ${product.id} in memory`);
    },
  };
}
