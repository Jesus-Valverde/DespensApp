import Papa from 'papaparse'
import { parseMoney } from '../../lib/money'
import { UNIT_SYMBOLS } from '../../db/db'
import type { Period, Product } from '../../db/types'

/** Unit symbols accepted in the Unidad column (mirrors the CSV guide). */
export const CSV_UNITS: Record<string, string> = Object.fromEntries(
  UNIT_SYMBOLS.map((symbol) => [symbol.toLowerCase(), symbol]),
)

const FREQUENCIES: Record<string, Exclude<Period, null>> = {
  semanal: 'semanal',
  quincenal: 'quincenal',
  mensual: 'mensual',
}

/** Column contract (order matters for the generated template). */
export const CATALOG_COLUMNS = [
  'Nombre',
  'Marca',
  'Modelo',
  'Contenido',
  'Unidad',
  'Familia',
  'Área',
  'Descripción',
  'Stock actual',
  'Stock mínimo',
  'Stock máximo',
  'Ubicación',
  'Precio referencia',
  'Frecuencia',
] as const

/** Example rows shipped inside the generated template (same as the legacy CSV). */
const TEMPLATE_EXAMPLES = [
  ['Leche', 'Lala', '100 Entera', '1', 'L', 'Lácteo', 'Refri', 'Leche entera pasteurizada', '6', '2', '12', 'Refri', '28.00', 'Semanal'],
  ['Frijol negro', 'Isadora', '500 g', '500', 'g', 'Granos', 'Alacena', '', '2', '1', '6', 'Alacena', '22.50', 'Quincenal'],
]

export interface ProductDraft {
  title: string
  brand?: string
  model?: string
  content?: string
  unit?: string
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

/** Validates raw header-keyed rows (shared by the CSV and XLSX readers). */
function buildDrafts(rows: Record<string, string>[]): CatalogCsvParse {
  const drafts: ProductDraft[] = []
  const errors: CsvRowError[] = []

  rows.forEach((raw, index) => {
    const rowNumber = index + 2 // + header row
    const rowErrors: string[] = []

    const title = clean(raw['Nombre'])
    if (!title) rowErrors.push('falta el Nombre')

    const contenido = clean(raw['Contenido'])
    const unidadRaw = clean(raw['Unidad']).toLowerCase()
    let content: string | undefined
    let unit: string | undefined
    if (contenido || unidadRaw) {
      const qty = Number(contenido)
      if (!contenido || !Number.isFinite(qty) || qty <= 0) rowErrors.push('Contenido debe ser un número mayor a 0')
      if (!unidadRaw || !CSV_UNITS[unidadRaw]) {
        rowErrors.push('Unidad no válida (usa L, ml, g, kg, pza o paq)')
      } else if (Number.isFinite(qty) && qty > 0) {
        content = contenido
        unit = CSV_UNITS[unidadRaw]
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

    drafts.push({
      title,
      brand: optional(clean(raw['Marca'])),
      model: optional(clean(raw['Modelo'])),
      content,
      unit,
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

  return { rows: drafts, errors }
}

/** Parses catalog CSV text (headers in Spanish, comma or semicolon separated).
 * Rows with problems are returned per-row; valid rows become product drafts. */
export function parseCatalogCsv(text: string): CatalogCsvParse {
  const parsed = Papa.parse<Record<string, string>>(text.replace(/^\uFEFF/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
  })
  return buildDrafts(parsed.data)
}

const XLSX_EXTENSIONS = /\.(xlsx|xls)$/i

/** Parses an uploaded catalog file — .xlsx/.xls via SheetJS, plain text
 * (.csv) via PapaParse — into the same validated draft set. */
export async function parseCatalogFile(file: File): Promise<CatalogCsvParse> {
  if (XLSX_EXTENSIONS.test(file.name)) {
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(await file.arrayBuffer())
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '', raw: false })
    return buildDrafts(rows)
  }
  return parseCatalogCsv(await file.text())
}

type XLSXModule = typeof import('xlsx')

/** Builds the catalog template workbook (headers + 2 example rows). */
export async function buildCatalogTemplate(): Promise<XLSXModule.WorkBook> {
  const XLSX: XLSXModule = await import('xlsx')
  const sheet = XLSX.utils.aoa_to_sheet([CATALOG_COLUMNS, ...TEMPLATE_EXAMPLES])
  sheet['!cols'] = CATALOG_COLUMNS.map((header) => ({ wch: Math.max(header.length + 4, 10) }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Catálogo')
  return workbook
}

/** Generates the catalog template as .xlsx and triggers the browser download. */
export async function downloadCatalogTemplate(): Promise<void> {
  const XLSX: XLSXModule = await import('xlsx')
  XLSX.writeFile(await buildCatalogTemplate(), 'plantilla-catalogo.xlsx')
}
