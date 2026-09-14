import Papa from 'papaparse'
import { parseMoney } from '../../lib/money'
import type { Period, Product } from '../../db/types'

/** Unit symbols accepted in the Unidad column (mirrors the CSV guide). */
export const CSV_UNITS: Record<string, string> = {
  l: 'L',
  ml: 'ml',
  g: 'g',
  kg: 'kg',
  pza: 'pza',
  paq: 'paq',
}

const FREQUENCIES: Record<string, Exclude<Period, null>> = {
  semanal: 'semanal',
  quincenal: 'quincenal',
  mensual: 'mensual',
}

export interface ProductDraft {
  title: string
  brand?: string
  model?: string
  contentSize?: string
  family?: string
  area?: string
  description?: string
  stock: { current: number; min: number | null; max: number | null; location?: string }
  purchase: Pick<Product['purchase'], 'originalPrice' | 'period'> & {
    secondarySupplierIds: []
    links: []
  }
}

export interface CsvRowError {
  row: number
  message: string
}

export interface CatalogCsvParse {
  rows: ProductDraft[]
  errors: CsvRowError[]
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function optional(value: string): string | undefined {
  return value || undefined
}

function toInt(value: string): number | null {
  if (!value) return null
  const n = Number(value)
  return Number.isInteger(n) && n >= 0 ? n : null
}

/** Parses catalog CSV text (headers in Spanish, comma or semicolon separated).
 * Rows with problems are returned per-row; valid rows become product drafts. */
export function parseCatalogCsv(text: string): CatalogCsvParse {
  const parsed = Papa.parse<Record<string, string>>(text.replace(/^\uFEFF/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
  })
  const rows: ProductDraft[] = []
  const errors: CsvRowError[] = []

  parsed.data.forEach((raw, index) => {
    const rowNumber = index + 2 // + header row
    const rowErrors: string[] = []

    const title = clean(raw['Nombre'])
    if (!title) rowErrors.push('falta el Nombre')

    const contenido = clean(raw['Contenido'])
    const unidadRaw = clean(raw['Unidad']).toLowerCase()
    let contentSize: string | undefined
    if (contenido || unidadRaw) {
      const qty = Number(contenido)
      if (!contenido || !Number.isFinite(qty) || qty <= 0) rowErrors.push('Contenido debe ser un número mayor a 0')
      if (!unidadRaw || !CSV_UNITS[unidadRaw]) {
        rowErrors.push('Unidad no válida (usa L, ml, g, kg, pza o paq)')
      } else if (Number.isFinite(qty) && qty > 0) {
        contentSize = `${contenido} ${CSV_UNITS[unidadRaw]}`
      }
    }

    const currentRaw = clean(raw['Stock actual'])
    const current = currentRaw ? toInt(currentRaw) : 0
    const min = toInt(clean(raw['Stock mínimo']))
    const max = toInt(clean(raw['Stock máximo']))
    if (currentRaw && current == null) rowErrors.push('Stock actual inválido')
    if (clean(raw['Stock mínimo']) && min == null) rowErrors.push('Stock mínimo inválido')
    if (clean(raw['Stock máximo']) && max == null) rowErrors.push('Stock máximo inválido')

    const priceText = clean(raw['Precio referencia'])
    let originalPrice: number | undefined
    if (priceText) {
      const cents = parseMoney(priceText)
      if (cents == null || cents < 0) rowErrors.push('Precio referencia inválido')
      else originalPrice = cents
    }

    const frequency = clean(raw['Frecuencia']).toLowerCase()
    let period: Period = null
    if (frequency) {
      if (!FREQUENCIES[frequency]) rowErrors.push('Frecuencia no válida (Semanal, Quincenal o Mensual)')
      else period = FREQUENCIES[frequency]
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNumber, message: rowErrors.join('; ') })
      return
    }

    rows.push({
      title,
      brand: optional(clean(raw['Marca'])),
      model: optional(clean(raw['Modelo'])),
      contentSize,
      family: optional(clean(raw['Familia'])),
      area: optional(clean(raw['Área'])),
      description: optional(clean(raw['Descripción'])),
      stock: {
        current: current ?? 0,
        min,
        max,
        location: optional(clean(raw['Ubicación'])),
      },
      purchase: {
        originalPrice,
        period,
        secondarySupplierIds: [],
        links: [],
      },
    })
  })

  return { rows, errors }
}
