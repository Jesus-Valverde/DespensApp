import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { Layout } from './Layout'
import { ProductForm, EditProductScreen } from '../features/products/ProductForm'
import { ProductDetail } from '../features/products/ProductDetail'
import { CartForm } from '../features/carts/CartForm'
import { CartDetail } from '../features/carts/CartDetail'
import { ListDetail } from '../features/lists/ListDetail'
import { InicioScreen } from '../features/reports/InicioScreen'
import { DespensaScreen } from '../features/despensa/DespensaScreen'
import { ComprasScreen } from '../features/compras/ComprasScreen'
import { RememberedViewRedirect } from '../lib/viewToggle'
import { generateAutoCart } from '../features/carts/api'

// Run-once guard: StrictMode double-invokes effects in dev, and the active-cart
// dedupe inside generateAutoCart already makes re-runs no-ops — the flag just
// avoids the redundant pass (design decision 9: auto-cart on app open).
let autoCartTriggered = false

export function App() {
  useEffect(() => {
    if (autoCartTriggered) return
    autoCartTriggered = true
    void generateAutoCart().catch(() => {
      // Best-effort trigger: local-first with nothing to show on failure.
    })
  }, [])

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<InicioScreen />} />

          {/* Despensa module: Stock | Catálogo (remembered view). */}
          <Route
            path="/despensa"
            element={<RememberedViewRedirect storageKey="despensapp:despensa-view" fallback="/despensa/stock" />}
          />
          <Route path="/despensa/stock" element={<DespensaScreen view="stock" />} />
          <Route path="/despensa/catalogo" element={<DespensaScreen view="catalogo" />} />

          {/* Compras module: Carritos | Listas | Proveedores (remembered view). */}
          <Route
            path="/compras"
            element={<RememberedViewRedirect storageKey="despensapp:compras-view" fallback="/compras/carritos" />}
          />
          <Route path="/compras/carritos" element={<ComprasScreen view="carritos" />} />
          <Route path="/compras/listas" element={<ComprasScreen view="listas" />} />
          <Route path="/compras/proveedores" element={<ComprasScreen view="proveedores" />} />

          {/* Product forms/detail keep their own URLs; the catalog itself has
              no tab — its list route redirects into Despensa. */}
          <Route path="/products" element={<Navigate to="/despensa/catalogo" replace />} />
          <Route path="/products/new" element={<ProductForm />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/products/:id/edit" element={<EditProductScreen />} />

          {/* Legacy list routes redirect into the Compras module. */}
          <Route path="/carts" element={<Navigate to="/compras/carritos" replace />} />
          <Route path="/carts/new" element={<CartForm />} />
          <Route path="/carts/:id" element={<CartDetail />} />
          <Route path="/lists" element={<Navigate to="/compras/listas" replace />} />
          <Route path="/lists/:id" element={<ListDetail />} />
          <Route path="/settings/suppliers" element={<Navigate to="/compras/proveedores" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}
