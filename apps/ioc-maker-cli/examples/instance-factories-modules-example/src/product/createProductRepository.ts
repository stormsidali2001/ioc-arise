import { IAppConfig } from '../core/IAppConfig';
import { ILogger } from '../core/ILogger';
import { IProductRepository } from './IProductRepository';

/**
 * Instance factory — context object pattern.
 * Dependencies are bundled into a single `context` argument.
 */
export function createProductRepository(
  context: { config: IAppConfig; logger: ILogger },
): IProductRepository {
  const { config, logger } = context;
  const store = new Map<string, { id: string; name: string; price: number }>();
  const storageType = config.getStorageType();

  logger.info(`ProductRepository: initialising with storage="${storageType}"`);

  return {
    findAll: () => Array.from(store.values()),
    findById: (id) => store.get(id) ?? null,
    save: (product) => {
      store.set(product.id, product);
      logger.info(`ProductRepository: saved product ${product.id}`);
    },
  };
}
