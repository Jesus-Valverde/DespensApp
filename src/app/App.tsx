import { HashRouter, Route, Routes } from 'react-router'
import { Layout } from './Layout'
import { SuppliersScreen } from '../features/suppliers/SuppliersScreen'
import { ProductList } from '../features/products/ProductList'
import { ProductForm, EditProductScreen } from '../features/products/ProductForm'
import { ProductDetail } from '../features/products/ProductDetail'

function PlaceholderScreen({ title, note }: { title: string; note: string }) {
  return (
    <section>
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">{note}</p>
    </section>
  )
}

export function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={<PlaceholderScreen title="Inicio" note="Aquí verás Faltantes y Próximas compras." />}
          />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/new" element={<ProductForm />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/products/:id/edit" element={<EditProductScreen />} />
          <Route
            path="/carts"
            element={<PlaceholderScreen title="Carritos" note="Aquí gestionarás tus carritos de compra." />}
          />
          <Route
            path="/carts/new"
            element={<PlaceholderScreen title="Nuevo carrito" note="La creación de carritos llegará en el próximo incremento." />}
          />
          <Route
            path="/lists"
            element={<PlaceholderScreen title="Listas" note="Aquí organizarás tus listas de compras." />}
          />
          <Route path="/settings/suppliers" element={<SuppliersScreen />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}
