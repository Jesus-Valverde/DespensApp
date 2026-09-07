import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { CustomProp, Product } from '../../db/types'
import { downscaleImage } from '../../lib/image'
import { useObjectUrl } from '../../lib/useObjectUrl'
import { createProduct, updateProduct, distinctAreas } from './api'

interface TextFieldState {
  title: string
  brand: string
  contentSize: string
  area: string
  model: string
}

const EMPTY_FIELDS: TextFieldState = { title: '', brand: '', contentSize: '', area: '', model: '' }

export function ProductForm({ product }: { product?: Product }) {
  const navigate = useNavigate()
  const [fields, setFields] = useState<TextFieldState>(() =>
    product
      ? {
          title: product.title,
          brand: product.brand ?? '',
          contentSize: product.contentSize ?? '',
          area: product.area ?? '',
          model: product.model ?? '',
        }
      : EMPTY_FIELDS,
  )
  const [customProps, setCustomProps] = useState<CustomProp[]>(
    () => product?.customProps.map((prop) => ({ ...prop })) ?? [],
  )
  const [image, setImage] = useState<Blob | undefined>(product?.image)
  const [error, setError] = useState('')
  const imageUrl = useObjectUrl(image)

  const products = useLiveQuery(() => db.products.toArray(), []) ?? []
  const areas = distinctAreas(products)

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
    } catch {
      setError('No se pudo procesar la imagen')
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const datos = {
      title: fields.title,
      brand: fields.brand.trim() || undefined,
      contentSize: fields.contentSize.trim() || undefined,
      area: fields.area.trim() || undefined,
      model: fields.model.trim() || undefined,
      customProps: customProps
        .map((prop) => ({ key: prop.key.trim(), value: prop.value.trim() }))
        .filter((prop) => prop.key.length > 0 || prop.value.length > 0),
      image,
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

  const inputClass = 'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm'

  return (
    <section>
      <h1 className="text-xl font-semibold">{product ? 'Editar producto' : 'Nuevo producto'}</h1>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label htmlFor="product-title" className="text-sm font-medium">
            Nombre
          </label>
          <input id="product-title" value={fields.title} onChange={setField('title')} className={inputClass} />
        </div>
        <div>
          <label htmlFor="product-brand" className="text-sm font-medium">
            Marca
          </label>
          <input id="product-brand" value={fields.brand} onChange={setField('brand')} className={inputClass} />
        </div>
        <div>
          <label htmlFor="product-content" className="text-sm font-medium">
            Contenido
          </label>
          <input
            id="product-content"
            value={fields.contentSize}
            onChange={setField('contentSize')}
            placeholder="1 L, 500 g…"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="product-area" className="text-sm font-medium">
            Área
          </label>
          <input
            id="product-area"
            list="product-areas"
            value={fields.area}
            onChange={setField('area')}
            placeholder="Refri, Alacena…"
            className={inputClass}
          />
          <datalist id="product-areas">
            {areas.map((area) => (
              <option key={area} value={area} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="product-model" className="text-sm font-medium">
            Modelo
          </label>
          <input id="product-model" value={fields.model} onChange={setField('model')} className={inputClass} />
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Propiedades personalizadas</legend>
          <ul className="mt-2 space-y-2">
            {customProps.map((prop, index) => (
              <li key={index} className="flex items-end gap-2">
                <label className="flex-1 text-xs text-slate-500">
                  Propiedad
                  <input
                    value={prop.key}
                    onChange={(event) => setProp(index, 'key', event.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="flex-1 text-xs text-slate-500">
                  Valor
                  <input
                    value={prop.value}
                    onChange={(event) => setProp(index, 'value', event.target.value)}
                    className={inputClass}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setCustomProps((current) => current.filter((_, i) => i !== index))}
                  className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-600"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setCustomProps((current) => [...current, { key: '', value: '' }])}
            className="mt-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            Agregar propiedad
          </button>
        </fieldset>

        <div>
          <label className="block text-sm font-medium">
            Imagen
            <input
              id="product-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1 block w-full text-sm"
            />
          </label>
          {imageUrl && (
            <div className="mt-2 flex items-center gap-3">
              <img src={imageUrl} alt="Vista previa" className="h-20 w-20 rounded-md object-cover" />
              <button
                type="button"
                onClick={() => setImage(undefined)}
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600"
              >
                Quitar imagen
              </button>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Guardar
          </button>
          <Link
            to="/products"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium"
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
