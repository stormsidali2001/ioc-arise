import { IAppConfig } from './IAppConfig';

/**
 * @value
 */
export const appConfig: IAppConfig = {
  getStorageType: () => (process.env.STORAGE_TYPE as 'memory' | 'persistent') ?? 'memory',
  getDbPath: () => process.env.DB_PATH ?? './data.db',
};
