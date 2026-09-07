# Proposal: DespensApp Core

## Intent

Replace the Google Sheets pantry tracker with a local-first, offline, installable PWA (Spanish UI, English identifiers, MXN). One household manages pantry data on-device. Sheets column mapping: Marca→brand, Modelo→content size, Contenido→supplier, Tenerlo→stock, Agregar al carrito→cart item.

## Scope

### In Scope
- Task 0 scaffold: Vite + React + TS + Dexie + vite-plugin-pwa + Vitest/Testing Library; Spanish mobile-first shell.
- Products: CRUD + duplicate; custom k-v properties, brand, model/description, content size, area, image (local Blob, downscaled).
- Inventory: current/min/max quantity, location; movements entrada/salida/ajuste with append-only bitácora.
- Suppliers: CRUD (name, type, locations).
- Purchase info per product: primary/secondary suppliers, original price, last/next purchase price+date, period (weekly/biweekly/monthly), purchase links.
- Carts: manual + auto-generated per period; items grouped by supplier; "buy cart" creates inventory entries, updates last/next price+date; cancel + history.
- Lists: CRUD.
- Reports (on-screen): out of stock (current ≤ min), upcoming purchases.

### Out of Scope
- Google Drive backup (separate change), sync/multi-user, push notifications, CSV/PDF export, barcode scanning, cropping, analytics.

## Capabilities

### New Capabilities
- `product-catalog`: product CRUD, duplicate, custom properties, image, areas.
- `inventory-management`: stock levels, locations, movements + bitácora.
- `supplier-management`: supplier CRUD.
- `purchase-planning`: per-product purchase info, supplier links, period scheduling.
- `cart-management`: cart lifecycle, supplier grouping, buy-cart transaction, auto-generation.
- `shopping-lists`: product lists CRUD.
- `reporting`: out-of-stock and upcoming-purchase reports.

### Modified Capabilities
None (greenfield).

## Approach

Dexie/IndexedDB, 100% local. Relationships:
- Product 1—1 Inventory; Movement N—1 Product (append-only).
- PurchaseInfo N—1 Product; references primary + secondary Suppliers.
- CartItem N—1 Cart/Product; supplier denormalized for grouping.
- List M—N Product.

Buy cart = one Dexie transaction: entrada movement per item, update last price/date, recompute next date from period, mark purchased.

Auto-carts: on app open + manual trigger; products with nextPurchaseDate ≤ today join a new period cart grouped by primary supplier.

Slices:
1. Scaffold + shell (task 0)
2. Suppliers + Products
3. Inventory + movements
4. Purchase info
5. Carts + buy cart + auto-generation
6. Lists + reports

Tailwind v4 recommended (confirm in design).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/db/` | New | Dexie schema, types, migrations |
| `src/features/` | New | feature modules per capability |
| `src/App.tsx`, `index.html` | New | Spanish mobile-first shell |
| `vite.config.ts` | New | PWA plugin config |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Image Blobs bloat IndexedDB quota | Med | Downscale on upload; image optional |
| Buy-cart multi-entity write consistency | Med | Single Dexie transaction + tests |
| Auto-cart timing unclear | Med | On-open + manual trigger |
| Initial data entry burden | Med | Duplicate + quick-add flows |

## Rollback Plan

Greenfield: revert feature commits or delete `src/`; bump Dexie schema version to reset local DB. No external systems.

## Dependencies

npm only: react, dexie, vite, vite-plugin-pwa, vitest, @testing-library/*; optional tailwindcss.

## Success Criteria

- [ ] Installable PWA, offline, all data local.
- [ ] Full Sheets workflow reproduced: product CRUD/duplicate, movements, buy cart updating price/date/stock, reports.
- [ ] `npm test` and `npm run build` pass (post task 0).
- [ ] Spanish UI copy, English identifiers, MXN prices.
