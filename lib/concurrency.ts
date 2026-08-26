/**
 * Runs `fn` over `items` with at most `concurrency` in flight at once —
 * bounded parallelism instead of a single Promise.all (which could open too
 * many simultaneous connections/requests for a large batch) or a plain
 * sequential loop (too slow once there are more than a handful of items,
 * risking a serverless function's execution time limit).
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await fn(items[current], current);
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workerCount }, worker));

  return results;
}
