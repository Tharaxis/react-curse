/** 
 * Splits an array of elements into separate chunks of a specified length.
 * @param arr The array of elements to split.
 * @param size The chunk size.
 * @param cache The chunk cache.
 * @returns The array of chunks.
 */
export function chunk<T>(arr: ReadonlyArray<T>, size: number, cache: ReadonlyArray<T>[] = []): ReadonlyArray<ReadonlyArray<T>> {
  const tmp = [...arr];

  while (tmp.length) cache.push(tmp.splice(0, size));

  return cache;
}
