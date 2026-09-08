// Product visual picker data (Stitch design): 25 pantry icons + 11 soft
// background tones. Shared by the product form picker and list thumbnails.

export interface ProductIcon {
  key: string
  label: string
  path: string
}

export interface IconTone {
  key: string
  label: string
  chip: string
  fg: string
}

export const PRODUCT_ICONS: ProductIcon[] = [
  { key: 'lacteos', label: 'Lácteos', path: 'M8 2h8v3H8V2zM7 5h10l1 3v12a2 2 0 01-2 2H8a2 2 0 01-2-2V8l1-3zM7 11h10' },
  { key: 'frutas', label: 'Frutas', path: 'M12 4c.5-1.5 2-2 3-2m-3 2c-4 0-7 3-7 8 0 4.5 3 8 7 8s7-3.5 7-8c0-5-3-8-7-8z' },
  { key: 'verduras', label: 'Verduras', path: 'M12 2a4 4 0 00-4 4c0 3.5 4 10 4 10s4-6.5 4-10a4 4 0 00-4-4zm-4 17l4 3 4-3' },
  { key: 'pan', label: 'Pan', path: 'M5 10c0-3 3-5 7-5s7 2 7 5v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5zM8 9v3m4-3v3m4-3v3' },
  { key: 'cafe', label: 'Café', path: 'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3m4-3v3m4-3v3' },
  { key: 'carne', label: 'Carne', path: 'M19 5c-3 0-5 2-8 5l-2 2a4 4 0 00-1 5l1 1a4 4 0 005-1l2-2c3-3 5-5 5-8 0-1-1-2-2-2zM6 18l-3 3' },
  { key: 'pescado', label: 'Pescado', path: 'M2 12c4 4 10 5 14 3l4 4v-8l-4-4c-4-2-10-1-14 3zm12-1a1 1 0 100-2 1 1 0 000 2z' },
  { key: 'limpieza', label: 'Limpieza', path: 'M10 2h4m-2 0v4m-3 0h6l1 3H8l1-3zm-1 3h8l1 11a2 2 0 01-2 2H9a2 2 0 01-2-2l1-11z' },
  { key: 'higiene', label: 'Higiene', path: 'M7 11V7a5 5 0 0110 0v4m-9 0h8a3 3 0 013 3v4a3 3 0 01-3 3H8a3 3 0 01-3-3v-4a3 3 0 013-3z' },
  { key: 'snacks', label: 'Snacks', path: 'M12 2a10 10 0 1010 10A10 10 0 0012 2zm-3 6a1.5 1.5 0 11-1.5 1.5A1.5 1.5 0 019 8zm6 1a1.5 1.5 0 11-1.5 1.5A1.5 1.5 0 0115 9zm-5 6a1.5 1.5 0 11-1.5 1.5A1.5 1.5 0 0110 15zm5.5-.5a1.5 1.5 0 11-1.5 1.5 1.5 1.5 0 011.5-1.5z' },
  { key: 'bebidas', label: 'Bebidas', path: 'M8 4a4 2 0 108 0 4 2 0 10-8 0zM8 4v16a4 2 0 008 0V4M8 12a4 2 0 008 0' },
  { key: 'huevos', label: 'Huevos', path: 'M12 3C8 3 5 8 5 14a7 7 0 0014 0c0-6-3-11-7-11z' },
  { key: 'pastas', label: 'Pastas', path: 'M4 14c2.5 0 3-3 6-3s3.5 3 6 3 3-3 4-3M4 18c2.5 0 3-3 6-3s3.5 3 6 3 3-3 4-3M4 10c2.5 0 3-3 6-3s3.5 3 6 3 3-3 4-3' },
  { key: 'granos', label: 'Granos', path: 'M12 2l3 5-3 5-3-5 3-5zm-6 9l3 5-3 5-3-5 3-5zm12 0l3 5-3 5-3-5 3-5z' },
  { key: 'aceites', label: 'Aceites', path: 'M10 2h4v3h-4V2zm-1 5l2-2h2l2 2v2l-1 1v9a3 3 0 01-3 3h0a3 3 0 01-3-3v-9L9 9V7z' },
  { key: 'enlatados', label: 'Enlatados', path: 'M6 6c0-2.2 2.7-4 6-4s6 1.8 6 4v12c0 2.2-2.7 4-6 4s-6-1.8-6-4V6zm0 0c0 2.2 2.7 4 6 4s6-1.8 6-4' },
  { key: 'especias', label: 'Especias', path: 'M10 3h4m-3 0v4m-3 3h8v9a2 2 0 01-2 2h-4a2 2 0 01-2-2v-9zm2 4h4m-4 3h3' },
  { key: 'dulces', label: 'Dulces', path: 'M4 11l4-4a4 4 0 015.6 0l1.4 1.4a4 4 0 010 5.6l-4 4M7 8l9 9M2 20l2-2' },
  { key: 'congelados', label: 'Congelados', path: 'M12 2v20m-7-3l14-14m0 14L5 5m7 5l-2-2m2 8l2 2m-8-2l-2 2m10-10l2-2' },
  { key: 'cereales', label: 'Cereales', path: 'M4 10a8 8 0 0016 0H4zm8-7v4m-4-3l2 3m6-3l-2 3M6 19h12' },
  { key: 'mascotas', label: 'Mascotas', path: 'M12 13a4 4 0 00-4 4c0 2.2 1.8 3 4 3s4-.8 4-3a4 4 0 00-4-4zm-5-3a2 2 0 11-4 0 2 2 0 014 0zm14 0a2 2 0 11-4 0 2 2 0 014 0zm-11-4a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0z' },
  { key: 'bebe', label: 'Bebé', path: 'M9 3h6v3H9V3zm-1 3h8l1 13a2 2 0 01-2 2H9a2 2 0 01-2-2L8 6zm2 6h4m-4 3h4' },
  { key: 'farmacia', label: 'Farmacia', path: 'M12 6v12m-6-6h12m2-7H4a2 2 0 00-2 2v14a2 2 0 002 2h16a2 2 0 002-2V5a2 2 0 00-2-2z' },
  { key: 'almacen', label: 'Almacén', path: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { key: 'otros', label: 'Otros', path: 'M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z' },
]

export const ICON_TONES: IconTone[] = [
  { key: 'azul', label: 'Azul suave', chip: 'bg-blue-50', fg: 'text-blue-600' },
  { key: 'menta', label: 'Verde menta', chip: 'bg-emerald-50', fg: 'text-emerald-600' },
  { key: 'ambar', label: 'Ámbar suave', chip: 'bg-amber-100', fg: 'text-amber-700' },
  { key: 'naranja', label: 'Naranja suave', chip: 'bg-orange-50', fg: 'text-orange-600' },
  { key: 'coral', label: 'Coral pastel', chip: 'bg-rose-50', fg: 'text-rose-500' },
  { key: 'rosa', label: 'Rosa suave', chip: 'bg-pink-50', fg: 'text-pink-600' },
  { key: 'lavanda', label: 'Lavanda', chip: 'bg-violet-50', fg: 'text-violet-600' },
  { key: 'indigo', label: 'Índigo suave', chip: 'bg-indigo-50', fg: 'text-indigo-600' },
  { key: 'cian', label: 'Cian cielo', chip: 'bg-cyan-50', fg: 'text-cyan-600' },
  { key: 'lima', label: 'Lima pastel', chip: 'bg-lime-50', fg: 'text-lime-600' },
  { key: 'gris', label: 'Gris neutro', chip: 'bg-slate-100', fg: 'text-slate-500' },
]

/** Icon path for a key, falling back to the pantry box for unknown keys. */
export function iconPath(key: string | undefined): string {
  return PRODUCT_ICONS.find((icon) => icon.key === key)?.path ?? iconPath('almacen')
}

/** Tone classes (bg + fg) for a key, falling back to azul for unknown keys. */
export function toneClasses(key: string | undefined): string {
  const tone = ICON_TONES.find((t) => t.key === key) ?? ICON_TONES[0]
  return `${tone.chip} ${tone.fg}`
}
