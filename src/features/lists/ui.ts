// Icon and color options for shopping lists (Stitch design). Stored as short
// keys on List.icon / List.color; the UI maps them to glyphs and Tailwind tones.

export interface ListIconOption {
  key: string
  label: string
  glyph: string
}

export interface ListColorOption {
  key: string
  name: string
  /** Soft chip classes (icon buttons). */
  chip: string
  /** Solid dot classes (color swatches). */
  dot: string
}

export const LIST_ICONS: ListIconOption[] = [
  {
    key: 'carrito',
    label: 'Carrito de compras',
    glyph: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
  },
  { key: 'bolsa', label: 'Bolsa de mandado', glyph: 'M16 11V7a4 4 0 00-8 0v4 M5 9h14l1 12H4L5 9z' },
  {
    key: 'despensa',
    label: 'Caja de despensa',
    glyph: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  },
  {
    key: 'parrilla',
    label: 'Parrillada y eventos',
    glyph: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343a7.975 7.975 0 012.344 5.657c0 2.122-.843 4.072-2.343 5.657z',
  },
  { key: 'oficina', label: 'Cafetería y oficina', glyph: 'M18 8h1a4 4 0 010 8h-1 M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z M6 1v4 M10 1v4 M14 1v4' },
]

export const LIST_COLORS: ListColorOption[] = [
  { key: 'azul', name: 'Azul Despensa', chip: 'bg-blue-100 text-blue-600', dot: 'bg-blue-600' },
  { key: 'esmeralda', name: 'Verde esmeralda', chip: 'bg-emerald-100 text-emerald-600', dot: 'bg-emerald-500' },
  { key: 'ambar', name: 'Ámbar cálido', chip: 'bg-amber-100 text-amber-600', dot: 'bg-amber-500' },
  { key: 'purpura', name: 'Púrpura vibrante', chip: 'bg-purple-100 text-purple-600', dot: 'bg-purple-600' },
  { key: 'rosa', name: 'Rosa coral', chip: 'bg-rose-100 text-rose-600', dot: 'bg-rose-500' },
  { key: 'indigo', name: 'Índigo noche', chip: 'bg-indigo-100 text-indigo-600', dot: 'bg-indigo-600' },
  { key: 'cian', name: 'Cian fresco', chip: 'bg-cyan-100 text-cyan-600', dot: 'bg-cyan-500' },
  { key: 'naranja', name: 'Naranja mandarina', chip: 'bg-orange-100 text-orange-600', dot: 'bg-orange-500' },
  { key: 'lima', name: 'Verde lima', chip: 'bg-lime-100 text-lime-600', dot: 'bg-lime-600' },
  { key: 'fucsia', name: 'Fucsia magenta', chip: 'bg-pink-100 text-pink-600', dot: 'bg-pink-600' },
  { key: 'pizarra', name: 'Gris pizarra', chip: 'bg-slate-200 text-slate-600', dot: 'bg-slate-600' },
]

export function listIconGlyph(key: string | undefined): string {
  return LIST_ICONS.find((option) => option.key === key)?.glyph ?? LIST_ICONS[0].glyph
}

export function listColorClasses(key: string | undefined): ListColorOption {
  return LIST_COLORS.find((option) => option.key === key) ?? LIST_COLORS[0]
}
