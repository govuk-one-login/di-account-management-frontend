export const createTimedMemoize = <T extends (...args: any[]) => any>(
  fn: T,
  maxAge: number
): T => {
  const cache = new Map();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.value;
    }

    const result = fn(...args);
    cache.set(key, { value: result, timestamp: Date.now() });
    return result;
  }) as T;
};
