import LRUCache from "lru-cache";
import { logError, logger } from "./logger";

const cache = new LRUCache<string, { data: any; expiresAt: number }>({
  max: 1000,
  maxAge: 24 * 60 * 60 * 1000,
});

async function cacheWithExpiration<T>(
  key: string,
  fn: () => Promise<T>,
  cacheDuration: number = 24 * 60 * 60 * 1000 // 24 hours
): Promise<T> {
  return Promise.resolve().then(async () => {
    const cachedData = cache.get(key);
    if (cachedData && Date.now() < cachedData.expiresAt) {
      return cachedData.data;
    }

    try {
      const data = await fn();
      const expiresAt = Date.now() + cacheDuration;
      cache.set(key, { data, expiresAt });
      return data;
    } catch (error) {
      invalidateCache(key);
      logError(logger, "Cache: error fetching data:", error);
      throw error;
    }
  });
}

function invalidateCache(key: string): void {
  cache.del(key);
}

export { cacheWithExpiration, invalidateCache };
