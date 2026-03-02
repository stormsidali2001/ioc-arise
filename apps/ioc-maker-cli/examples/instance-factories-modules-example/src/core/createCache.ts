import { ICache } from './ICache';

/**
 * Instance factory — no params.
 * The explicit return type `: ICache` is enough for detection.
 */
export function createCache(): ICache {
  const store = new Map<string, unknown>();
  return {
    get: (key) => store.get(key),
    set: (key, value) => { store.set(key, value); },
    delete: (key) => { store.delete(key); },
  };
}
