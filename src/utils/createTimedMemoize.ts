export const createTimedMemoize = <T extends (...args: any[]) => any>(
  fn: T,
  maxAge: number
): T => {
  const cache = new Map();

  return ((...args: Parameters<T>) => {
    let current = cache;

    for (const arg of args) {
      if (!current.has(arg)) {
        current.set(arg, new Map());
      }
      current = current.get(arg);
    }

    const key = args.length === 0 ? "__no_args__" : "__result__";
    const cached = current.get(key);

    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.value;
    }

    const result = fn(...args);
    current.set(key, { value: result, timestamp: Date.now() });
    return result;
  }) as T;
};
