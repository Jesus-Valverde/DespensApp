// Id helper for embedded arrays (e.g. product purchase links): ids are unique
// within their owning array, so max + 1 is enough — no global counter needed.

/** Returns a fresh id for an embedded array item: one above the current
 * maximum, starting at 1 for an empty array. */
export function nextId(items: { id: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}
