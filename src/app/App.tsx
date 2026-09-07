import { HashRouter, Route, Routes } from 'react-router'
import { Layout } from './Layout'

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
          <Route
            path="/products"
            element={<PlaceholderScreen title="Productos" note="Aquí administrarás tu catálogo de productos." />}
          />
          <Route
            path="/products/new"
            element={<PlaceholderScreen title="Nuevo producto" note="El formulario de productos llegará en el próximo incremento." />}
          />
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
          <Route
            path="/settings/suppliers"
            element={<PlaceholderScreen title="Ajustes" note="Aquí administrarás tus proveedores." />}
          />
        </Routes>
      </Layout>
    </HashRouter>
  )
}
