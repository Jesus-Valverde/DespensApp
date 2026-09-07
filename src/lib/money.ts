// Money helpers (design decision 5): amounts are integer centavos everywhere;
// rendering goes through Intl es-MX MXN. No decimal library needed.

// Up to two decimals, optional leading '-' (rejecting negatives is the api
// layer's job — it owns the Spanish validation message) and optional leading
// digit ("25.50", "25", ".5").
const AMOUNT_PATTERN = /^-?(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/

/** Parses a decimal string ("25.50") into integer centavos (2550).
 * Returns null for anything that is not a valid amount with at most two
 * decimals. Negative results are returned as-is; rejecting them is the
 * caller's validation concern. */
export function parseMoney(input: string): number | null {
  const trimmed = input.trim()
  if (!AMOUNT_PATTERN.test(trimmed)) return null
  return Math.round(parseFloat(trimmed) * 100)
}

const mxnFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

/** Formats integer centavos as MXN currency, e.g. 2550 → "$25.50". */
export function formatMoney(centavos: number): string {
  return mxnFormatter.format(centavos / 100)
}
