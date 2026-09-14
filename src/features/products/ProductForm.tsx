import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { CustomProp, Product } from '../../db/types'
import { downscaleImage } from '../../lib/image'
import { useObjectUrl } from '../../lib/useObjectUrl'
import { ICON_TONES, PRODUCT_ICONS } from '../../lib/icons'
import { createProduct, updateProduct, distinctAreas, distinctFamilies } from './api'

interface TextFieldState {
  title: string
  brand: string
  contentSize: string
  area: string
  family: string
  model: string
  description: string
}

const EMPTY_FIELDS: TextFieldState = { title: '', brand: '', contentSize: '', area: '', family: '', model: '', description: '' }

const labelClass = 'font-semibold text-slate-800 text-sm mb-1.5 block'
const inputClass =
  'w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-500'

function SearchGlyph() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

/** Text input with datalist, styled as the Stitch combobox (search + chevron). */
function ComboField({
  id,
  label,
  value,
  onChange,
  placeholder,
  listId,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (event: { target: { value: string } }) => void
  placeholder: string
  listId: string
  options: string[]
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
          <SearchGlyph />
        </span>
        <input
          id={id}
          list={listId}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${inputClass} pl-10 pr-10`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </div>
  )
}

/** Visual picker segmented control (Stitch design): Imagen dropzone / Ícono grid. */
function VisualPicker({
  image,
  imageUrl,
  onImageChange,
  onClearImage,
  iconKey,
  iconTone,
  onPickIcon,
  onPickTone,
}: {
  image: Blob | undefined
  imageUrl: string | undefined
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void
  onClearImage: () => void
  iconKey: string
  iconTone: string
  onPickIcon: (key: string) => void
  onPickTone: (key: string) => void
}) {
  const [tab, setTab] = useState<'imagen' | 'icono'>(iconKey ? 'icono' : 'imagen')
  const [iconQuery, setIconQuery] = useState('')

  const needle = iconQuery.trim().toLowerCase()
  const visibleIcons = needle
    ? PRODUCT_ICONS.filter((icon) => icon.label.toLowerCase().includes(needle))
    : PRODUCT_ICONS
  const currentTone = ICON_TONES.find((tone) => tone.key === iconTone) ?? ICON_TONES[0]

  return (
    <div className="pt-1">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-slate-800 text-sm">Visual del producto</span>
        <div className="inline-flex rounded-lg border border-slate-200/80 bg-slate-100 p-1" role="group" aria-label="Tipo de visual">
          {(['imagen', 'icono'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={tab === option}
              onClick={() => setTab(option)}
              className={`rounded-md px-3 py-1 text-xs transition-all ${
                tab === option
                  ? 'bg-white font-semibold text-blue-600 shadow-xs'
                  : 'font-medium text-slate-600 hover:text-slate-900'
              }`}
            >
              {option === 'imagen' ? 'Imagen' : 'Ícono'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'imagen' ? (
        <>
          <label
            htmlFor="product-image"
            className="group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-5 text-center transition-all hover:border-blue-400 hover:bg-blue-50/30"
          >
            <input
              id="product-image"
              type="file"
              accept="image/*"
              onChange={onImageChange}
              className="sr-only"
            />
            <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/70 bg-white text-blue-600 shadow-xs transition-transform group-hover:scale-105">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-blue-600">
              {image ? 'Cambiar imagen' : 'Toca para agregar imagen'}
            </span>
            <span className="mt-0.5 text-xs text-slate-500">PNG, JPG hasta 5MB o selecciona un ícono</span>
          </label>
          {imageUrl && (
            <div className="mt-2 flex items-center gap-3">
              <img src={imageUrl} alt="Vista previa" className="h-16 w-16 rounded-xl object-cover" />
              <button
                type="button"
                onClick={onClearImage}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Quitar imagen
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <SearchGlyph />
            </span>
            <input
              type="text"
              value={iconQuery}
              onChange={(event) => setIconQuery(event.target.value)}
              placeholder="Buscar ícono... leche, fruta, pan, limpieza"
              aria-label="Buscar ícono"
              className={`${inputClass} py-2 pl-9 pr-3 text-xs`}
            />
          </div>

          <div className="no-scrollbar grid max-h-64 grid-cols-5 gap-2 overflow-y-auto py-1 pr-1">
            {visibleIcons.map((icon) => {
              const selected = icon.key === iconKey
              return (
                <button
                  key={icon.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onPickIcon(icon.key)}
                  className={`relative flex flex-col items-center justify-center rounded-xl bg-white p-2 shadow-2xs transition-all ${
                    selected
                      ? 'border-2 border-blue-600 text-blue-600'
                      : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800'
                  }`}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
                  </svg>
                  <span
                    className={`mt-1 max-w-full truncate text-[10px] leading-tight ${
                      selected ? 'font-semibold text-blue-600' : 'font-medium text-slate-500'
                    }`}
                  >
                    {icon.label}
                  </span>
                  {selected && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs">
                      <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-200/80 pt-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Color de fondo</span>
              <span className="text-[11px] font-medium text-slate-500">{currentTone.label}</span>
            </div>
            <div className="grid grid-cols-9 gap-2 py-1">
              {ICON_TONES.map((tone) => {
                const selected = tone.key === iconTone
                return (
                  <button
                    key={tone.key}
                    type="button"
                    aria-label={tone.label}
                    aria-pressed={selected}
                    onClick={() => onPickTone(tone.key)}
                    className={`flex h-6 w-6 items-center justify-center rounded-full transition-all ${
                      selected ? 'border-2 border-blue-600 shadow-xs' : 'border border-slate-200 hover:border-slate-400'
                    } ${tone.swatch}`}
                  />
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function ProductForm({ product }: { product?: Product }) {
  const navigate = useNavigate()
  const [fields, setFields] = useState<TextFieldState>(() =>
    product
      ? {
          title: product.title,
          brand: product.brand ?? '',
          contentSize: product.contentSize ?? '',
          area: product.area ?? '',
          family: product.family ?? '',
          model: product.model ?? '',
          description: product.description ?? '',
        }
      : EMPTY_FIELDS,
  )
  const [customProps, setCustomProps] = useState<CustomProp[]>(
    () => product?.customProps.map((prop) => ({ ...prop })) ?? [],
  )
  const [image, setImage] = useState<Blob | undefined>(product?.image)
  const [iconKey, setIconKey] = useState(product?.iconKey ?? '')
  const [iconTone, setIconTone] = useState(product?.iconTone ?? 'azul')
  const [error, setError] = useState('')
  const imageUrl = useObjectUrl(image)

  const products = useLiveQuery(() => db.products.toArray(), []) ?? []
  const areas = distinctAreas(products)
  const families = distinctFamilies(products)

  function setField(field: keyof TextFieldState) {
    return (event: { target: { value: string } }) =>
      setFields((current) => ({ ...current, [field]: event.target.value }))
  }

  function setProp(index: number, propField: keyof CustomProp, value: string) {
    setCustomProps((current) =>
      current.map((prop, i) => (i === index ? { ...prop, [propField]: value } : prop)),
    )
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    try {
      setImage(await downscaleImage(file))
      setIconKey('') // an image replaces the icon
    } catch {
      setError('No se pudo procesar la imagen')
    }
  }

  function handlePickIcon(key: string) {
    setIconKey(key)
    setImage(undefined) // an icon replaces the image
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const datos = {
      title: fields.title,
      brand: fields.brand.trim() || undefined,
      contentSize: fields.contentSize.trim() || undefined,
      area: fields.area.trim() || undefined,
      family: fields.family.trim() || undefined,
      model: fields.model.trim() || undefined,
      description: fields.description.trim() || undefined,
      customProps: customProps
        .map((prop) => ({ key: prop.key.trim(), value: prop.value.trim() }))
        .filter((prop) => prop.key.length > 0 || prop.value.length > 0),
      image,
      iconKey,
      iconTone,
    }
    try {
      if (product?.id != null) {
        await updateProduct(product.id, datos)
        navigate(`/products/${product.id}`)
      } else {
        const newId = await createProduct(datos)
        navigate(`/products/${newId}`)
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar el producto')
    }
  }

  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold tracking-tight text-slate-900">
        {product ? 'Editar producto' : 'Nuevo producto'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div>
          {/* Required marker as a CSS pseudo-element: stays out of the label's
              accessible name; validation lives in the API and surfaces via the
              alert below (native `required` would show a browser-locale tooltip). */}
          <label
            htmlFor="product-title"
            className={`${labelClass} after:ml-0.5 after:content-['*'] after:text-red-500`}
          >
            Nombre del producto
          </label>
          <input
            id="product-title"
            value={fields.title}
            onChange={setField('title')}
            placeholder="Leche"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="product-brand" className={labelClass}>
            Marca
          </label>
          <input
            id="product-brand"
            value={fields.brand}
            onChange={setField('brand')}
            placeholder="Lala, Nutri, Alpura…"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="product-model" className={labelClass}>
            Modelo
          </label>
          <input
            id="product-model"
            value={fields.model}
            onChange={setField('model')}
            placeholder="Descripción o presentación…"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="product-content" className={labelClass}>
            Contenido
          </label>
          <input
            id="product-content"
            value={fields.contentSize}
            onChange={setField('contentSize')}
            placeholder="Ej. 1 L, 500 g…"
            className={inputClass}
          />
        </div>
        <ComboField
          id="product-family"
          label="Familia"
          value={fields.family}
          onChange={setField('family')}
          placeholder="Buscar familia..."
          listId="product-families"
          options={families}
        />
        <ComboField
          id="product-area"
          label="Área"
          value={fields.area}
          onChange={setField('area')}
          placeholder="Buscar área..."
          listId="product-areas"
          options={areas}
        />
        <div>
          <label htmlFor="product-description" className={labelClass}>
            Descripción
          </label>
          <textarea
            id="product-description"
            value={fields.description}
            onChange={setField('description')}
            placeholder="Descripción del producto…"
            rows={3}
            className={`${inputClass} resize-y`}
          />
        </div>

        <fieldset>
          <legend className={`${labelClass} mb-2`}>Propiedades personalizadas</legend>
          <ul className="space-y-2">
            {customProps.map((prop, index) => (
              <li key={index} className="flex items-end gap-2">
                <label className="flex-1 text-xs text-slate-500">
                  Propiedad
                  <input
                    value={prop.key}
                    onChange={(event) => setProp(index, 'key', event.target.value)}
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <label className="flex-1 text-xs text-slate-500">
                  Valor
                  <input
                    value={prop.value}
                    onChange={(event) => setProp(index, 'value', event.target.value)}
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setCustomProps((current) => current.filter((_, i) => i !== index))}
                  className="rounded-lg border border-red-200 px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setCustomProps((current) => [...current, { key: '', value: '' }])}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3.5 py-2 text-sm font-medium text-blue-600 shadow-2xs transition-colors hover:bg-blue-100/80 active:bg-blue-100"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Agregar propiedad
          </button>
        </fieldset>

        <VisualPicker
          image={image}
          imageUrl={imageUrl}
          onImageChange={handleImageChange}
          onClearImage={() => setImage(undefined)}
          iconKey={iconKey}
          iconTone={iconTone}
          onPickIcon={handlePickIcon}
          onPickTone={setIconTone}
        />

        {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex items-center gap-3 pt-3">
          <button
            type="submit"
            className="pressable flex-1 rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
          >
            Guardar
          </button>
          <Link
            to="/products"
            className="pressable whitespace-nowrap rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  )
}

export function EditProductScreen() {
  const { id } = useParams()
  const productId = Number(id)
  const product = useLiveQuery(() => db.products.get(productId), [productId])
  if (!product) return <p className="mt-4 text-sm text-slate-500">Cargando…</p>
  return <ProductForm product={product} />
}
