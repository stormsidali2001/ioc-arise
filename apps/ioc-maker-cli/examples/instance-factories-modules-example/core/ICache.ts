export interface ICache {
  get(key: string): unknown | undefined;
  set(key: string, value: unknown): void;
  delete(key: string): void;
}
