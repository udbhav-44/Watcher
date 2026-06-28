type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

/**
 * Tiny in-memory TTL cache for server-side API responses (Jikan, Anikoto).
 * Not shared across workers — sufficient for a single-node Pi deploy.
 */
export const memoryCache = {
  get<T>(key: string): T | undefined {
    const entry = store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return undefined;
    }
    return entry.value as T;
  },

  set<T>(key: string, value: T, ttlMs: number): void {
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
  },

  has(key: string): boolean {
    return memoryCache.get(key) !== undefined;
  }
};
