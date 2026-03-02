export interface IAppConfig {
  getStorageType(): 'memory' | 'persistent';
  getDbPath(): string;
}
