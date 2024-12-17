import LRUCache from "lru-cache";
import { logger } from "./logger";

const cache = new LRUCache<string, { data: any; expiresAt: number }>({
  max: 1000,
  maxAge: 24 * 60 * 60 * 1000,
});

/**
 * Caches the result of an asynchronous function with a time-based expiration.
 *
 * @param {string} key - The cache key.
 * @param {Function} fn - The asynchronous function to cache.
 * @param {number} [cacheDuration=defaultCacheDuration] - The cache duration in milliseconds.
 * @returns {Promise<any>} The cached result of the function.
 */
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
      logger.error("Error fetching data:", error);
      throw error;
    }
  });
}

function invalidateCache(key: string): void {
  cache.del(key);
}

export { cacheWithExpiration, invalidateCache };
