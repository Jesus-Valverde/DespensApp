import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router'
import { Layout } from './Layout'
import { SuppliersScreen } from '../features/suppliers/SuppliersScreen'
import { ProductList } from '../features/products/ProductList'
import { ProductForm, EditProductScreen } from '../features/products/ProductForm'
import { ProductDetail } from '../features/products/ProductDetail'
import { CartsScreen } from '../features/carts/CartsScreen'
import { CartForm } from '../features/carts/CartForm'
import { CartDetail } from '../features/carts/CartDetail'
import { ListsScreen } from '../features/lists/ListsScreen'
import { ListDetail } from '../features/lists/ListDetail'
import { InicioScreen } from '../features/reports/InicioScreen'
import { DespensaScreen } from '../features/despensa/DespensaScreen'
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
          <Route path="/despensa" element={<DespensaScreen />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/new" element={<ProductForm />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/products/:id/edit" element={<EditProductScreen />} />
          <Route path="/carts" element={<CartsScreen />} />
          <Route path="/carts/new" element={<CartForm />} />
          <Route path="/carts/:id" element={<CartDetail />} />
          <Route path="/lists" element={<ListsScreen />} />
          <Route path="/lists/:id" element={<ListDetail />} />
          <Route path="/settings/suppliers" element={<SuppliersScreen />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}
