# Design: DespensApp Core (despensa-core)

## Technical Approach

Greenfield installable PWA: one Vite SPA, 100% local data in IndexedDB via Dexie, zero backend. Screens read data through `useLiveQuery` (reactive queries); all writes go through plain async service functions (`src/features/*/api.ts`) that validate and wrap multi-entity writes in `db.transaction`. No state manager, no form library — React state + Dexie reactivity suffice. Maps to proposal slices 1–6 and all 7 capability specs.

## Stack

| Dep | Version | Role |
|---|---|---|
| react, react-dom | ^19 | UI |
| react-router | ^7 | Routing, library mode (HashRouter) |
| dexie | ^4 | IndexedDB wrapper |
| dexie-react-hooks | ^1 | `useLiveQuery` |
| tailwindcss + @tailwindcss/vite | ^4 | Styling |
| vite-plugin-pwa | ^1 | Manifest + workbox precache |
| dev: vite, @vitejs/plugin-react, typescript | latest | Build |
| dev: vitest, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, happy-dom, fake-indexeddb | latest | Tests |

## Architecture

```
src/
  app/            App.tsx (router + auto-cart on open), Layout (header + bottom tabs + FAB)
  db/             db.ts (Dexie schema v1), types.ts (entities)
  lib/            dates.ts, money.ts, image.ts, id.ts
  components/     ConfirmDialog, Field, EmptyState
  features/       products | inventory | suppliers | purchase | carts | lists | reports
                   each: api.ts (mutations/queries) + screens + local components
```

```
Screens ──useLiveQuery──→ Dexie (IndexedDB)
   │                          ↑
   └── api.ts calls ──validate→ db.transaction('rw', ...)
```

Buy cart (single transaction, per cart-management spec):
`for each item: entrada movement + product.purchase{lastPrice, lastPurchaseDate=today, next=last+period}` → `cart.status='purchased'`. All-or-nothing.

## Decision Log

| # | Topic | Decision | Rationale |
|---|---|---|---|
| 1 | Tailwind | **Confirm**, Tailwind v4 via `@tailwindcss/vite` | Zero-config utility CSS, mobile-first primitives; rejected CSS-in-JS (runtime cost) and MUI (bundle weight, styling fights) |
| 2 | Folders / routing / state | Feature-based (2 levels); HashRouter; no state lib | Features mirror capabilities; HashRouter works on any static host / cold offline start; liveQuery replaces a store |
| 3 | Dexie schema | 5 tables; stock + purchase info **embedded** in Product; cart items and list membership as arrays in parent | 1—1 and parent-owned relations, never queried standalone; separate tables only for suppliers, movements, carts, lists |
| 4 | Dates | `'YYYY-MM-DD'` strings (local semantics), ISO string timestamps; `Intl` es-MX formatting; period math in `lib/dates.ts` (~20 lines) | Lexicographically comparable = trivial `next <= today`; no date lib; native `<input type="date">` emits this format |
| 5 | Money | Integer **centavos** everywhere; format via `Intl.NumberFormat('es-MX', MXN)` | Exact arithmetic for cart totals; MXN uses 2 decimals; no decimal lib needed |
| 6 | UI shell | Bottom tabs: Inicio, Productos, Carritos, Listas, Ajustes (Proveedores inside Ajustes); header; FAB on Productos/Carritos; `max-w-md` centered; dark mode skipped (light only) | One-hand mobile use; reports live on Inicio; dark variant is cheap to add later via Tailwind `dark:` |
| 7 | Areas | Free text + `<datalist>` of distinct areas from products | Zero schema, zero migration; autocomplete UX for free |
| 8 | Product delete | Cascade delete everything (movements, memberships in carts/lists; purchase info dies with the row) in one transaction + Spanish confirm dialog | Bitácora is per-product; history dying with product matches spreadsheet reality |
| 9 | Auto-cart | `generateAutoCart()` on app open (root `useEffect`) + "Generar carrito" button; due = `nextPurchaseDate <= today` AND not in any active cart; group by primary supplier, else "Sin proveedor"; if none due, no-op | Active-cart membership IS the idempotency guard — no timers, no push, no "generated today" flag |
| 10 | Images | `createImageBitmap` + canvas downscale to max 512px, JPEG q=0.8, Blob on product; render via `useObjectUrl` (create+revoke) | Bounds quota; no image lib |
| 11 | PWA | `registerType: 'autoUpdate'`, plugin-injected manifest (es, standalone), placeholder 192/512 PNGs, workbox precache + navigateFallback, auto reload on new SW | Lazy update flow; SW active in build only |
| 12 | Testing | Vitest + happy-dom + fake-indexeddb + user-event. Unit: api/services (cascade, duplicate, movements, buy-cart atomicity, date recompute, auto-cart dedupe/grouping, list membership), lib utils. Component: forms show Spanish validation, screen smoke renders. No E2E | happy-dom faster than jsdom, adequate for TL; fake-indexeddb REQUIRED for Dexie in Node; E2E manual for now |
| 13 | Inputs | Native inputs: `type="number" inputMode="decimal"` (money), `inputMode="numeric"` (qty), `type="date"` | No picker/keyboard libs; aligns with centavos parsing and date strings |

Forms: plain controlled components (no react-hook-form) — forms are small; validation lives in `api.ts` (throws Spanish `Error`), forms catch and display.

## Data Model (Dexie v1, db name `despensapp`)

```ts
db.version(1).stores({
  products:   '++id, title, area, purchase.nextPurchaseDate',
  suppliers:  '++id, name',
  movements:  '++id, productId, date',
  carts:      '++id, status, createdAt',
  lists:      '++id',
})
```

```ts
type Period = 'semanal' | 'quincenal' | 'mensual' | null
interface Product {
  id?: number; title: string; brand?: string; contentSize?: string
  area?: string; model?: string; image?: Blob
  customProps: { key: string; value: string }[]      // unique keys
  stock: { current: number; min: number | null; max: number | null; location?: string }
  purchase: {
    primarySupplierId?: number; secondarySupplierIds: number[]
    originalPrice?: number; lastPrice?: number        // centavos MXN
    lastPurchaseDate?: string; nextPurchaseDate?: string; period: Period
    links: { id: number; url: string }[]
  }
  createdAt: string; updatedAt: string
}
interface Supplier { id?: number; name: string; type?: string; locations: string[] }
interface Movement {
  id?: number; productId: number; date: string        // ISO datetime
  type: 'entrada' | 'salida' | 'ajuste'
  qty: number; delta: number; resultingQty: number; note?: string
}
interface CartItem { productId: number; title: string; qty: number; unitPrice: number; supplierId: number | null; supplierName: string }
interface Cart {
  id?: number; name: string; status: 'active' | 'purchased' | 'cancelled'
  origin: 'manual' | 'auto'; createdAt: string; generatedAt?: string; purchasedAt?: string
  items: CartItem[]
}
interface List { id?: number; title: string; productIds: number[]; createdAt: string }
```

Movement semantics: entrada `delta=+qty`; salida `delta=-qty` (rejected if `qty > current`); ajuste sets absolute (`qty`=target, `delta`=target-current). Bitácora = `movements.where('productId').equals(id)` sorted desc; UI never offers edit/delete. Supplier delete: full product scan clears refs (hundreds of rows — no extra index needed) and reports affected count first.

## UI Map

| Route | Screen (Spanish) | Notes |
|---|---|---|
| `/` | Inicio | "Faltantes" (current<=min, shortfall desc) + "Próximas compras" (next date asc, overdue first) cards |
| `/products`, `/products/new`, `/products/:id` | Productos / Nuevo producto / Detalle | Detail sections: datos, stock + movimientos, bitácora, info de compra, listas; FAB = nuevo producto |
| `/carts`, `/carts/:id` | Carritos / Carrito | Grouped by supplier, "Pagar carrito", "Generar carrito", cancel; FAB = nuevo carrito |
| `/lists`, `/lists/:id` | Listas / Lista | Membership add/remove |
| `/settings/suppliers` | Ajustes → Proveedores | Supplier CRUD |

All copy in Spanish; identifiers in English; prices rendered MXN.

## Testing Strategy

| Layer | What | How |
|---|---|---|
| Unit | services/db layer: CRUD, cascade delete, duplicate, movement math/validation, buy-cart atomicity (incl. failure rollback), auto-cart due/dedupe/grouping, period recompute, money/date/image utils | Vitest + fake-indexeddb |
| Component | Forms (Spanish validation, reject paths), screen smoke renders, cart grouping render | Vitest + Testing Library + happy-dom + user-event |
| E2E | Manual: install, offline, image upload on device | Gap — accepted for MVP |

## Migration / Rollout

Greenfield — no migration. Dexie `version(1)`; schema changes later bump version. Rollout follows proposal slices (task 0 scaffold first; `strict_tdd` flips on after task 0).

## Risks

| Risk | Mitigation |
|---|---|
| Monthly period math (`setMonth` overflow, e.g. Jan 31 + 1 mes) | Clamp to end-of-month in `lib/dates.ts`; unit tests |
| Product records grow (image Blob + nested data) | Blobs are disk-backed references; 512px/JPEG q0.8; acceptable at household scale |
| happy-dom edge cases vs jsdom | Swap to jsdom is a one-line config change if needed |
| Auto-cart race on double open | Single-user, on-open guard in root effect; active-cart dedupe makes re-runs no-ops |
| No E2E / real-device PWA verification in CI | Manual checklist in verify phase |

## Open Questions

- None blocking. Auto-cart item defaults chosen: qty 1 (editable), unitPrice = `lastPrice ?? 0`.
