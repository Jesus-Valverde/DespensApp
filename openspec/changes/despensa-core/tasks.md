# Tasks: DespensApp Core

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main (direct work-unit commits to `main`; no remote) |
| Total estimated changed lines | ~4,000–4,400 across 6 batches |
| Chained PRs recommended | No — no remote; each batch is one conventional commit on `main` reviewed as a work unit |

| Batch | Scope | Est. lines | 400-line risk | Decision needed |
|-------|-------|-----------|---------------|-----------------|
| 1 | Task 0 scaffold + shell | ~380 | Medium | No |
| 2 | Suppliers + Products | ~1,000 | High | Yes |
| 3 | Inventory + movements | ~700 | High | Yes |
| 4 | Purchase planning | ~650 | Medium | Yes |
| 5 | Carts + buy + auto-generation | ~900 | High | Yes |
| 6 | Lists + reports + PWA gate | ~700 | Medium | Yes |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: High

> TDD contract: `strict_tdd` is false until Task 0 completes, then true. From Batch 2 on, `src/lib/*` utils and every `src/features/*/api.ts` are written test-first (RED → GREEN → REFACTOR; db-touching tests require fake-indexeddb). Components get pragmatic tests (Spanish validation paths + render smoke), not strict TDD. Validation lives in `api.ts` (throws Spanish `Error`); forms catch and display.

## Batch 1 — Task 0: Scaffold + Shell (slice 1)

- [x] 0.1 Scaffold Vite React-TS app at repo root; install deps per design Stack table (react 19, react-router 7, dexie 4, dexie-react-hooks, tailwindcss 4 + @tailwindcss/vite, vite-plugin-pwa; dev: vitest, @testing-library/{react,user-event,jest-dom}, happy-dom, fake-indexeddb). Files: `package.json`, `tsconfig.*`, `.gitignore`. Verify: `npm install` clean.
- [x] 0.2 Configure `vite.config.ts`: React + Tailwind v4 + PWA (`registerType: 'autoUpdate'`, plugin manifest es/standalone, placeholder `public/pwa-192.png` + `pwa-512.png`, workbox precache + navigateFallback) and Vitest (happy-dom, setup file `src/test/setup.ts`: jest-dom + fake-indexeddb autoimport). Verify: `npm run build` emits service worker.
- [x] 0.3 Create `src/db/db.ts` (Dexie v1, name `despensapp`, 5 stores exactly per design) and `src/db/types.ts` (Product, Supplier, Movement, Cart, CartItem, List per design data model). Verify: `src/db/db.test.ts` opens db under fake-indexeddb and asserts the 5 tables.
- [x] 0.4 Shell: `src/app/App.tsx` (HashRouter; routes `/`, `/products`, `/carts`, `/lists`, `/settings/suppliers` with placeholders) + `src/app/Layout.tsx` (header, bottom tabs Inicio/Productos/Carritos/Listas/Ajustes, `max-w-md`) + `src/index.css` (`@import "tailwindcss"`). Verify: `src/app/App.test.tsx` renders all 5 Spanish tabs.
- [x] 0.5 Gate: `npm test` and `npm run build` green; flip `strict_tdd: true` in `openspec/config.yaml` and Engram testing-capabilities (obs 416); commit `feat: scaffold vite react app with dexie, pwa and vitest`.

## Batch 2 — Suppliers + Products (slice 2)

- [x] 2.1 TDD `src/lib/image.ts` `downscaleImage(file)`: createImageBitmap + canvas, max 512px, JPEG q=0.8 Blob. Verify: `npm test -- image` (mock canvas; assert size/type). Implements: product-catalog image.
- [x] 2.2 TDD `src/features/suppliers/api.ts`: create/update (name required → Spanish Error), list, `deleteSupplier` (scan products → affected count, clear primary/secondary refs in one transaction, preserve prices/dates/period). Verify: unit tests cover all 5 supplier-management scenarios. Implements: supplier-management.
- [x] 2.3 Supplier screens `src/features/suppliers/` at `/settings/suppliers` (list + form, delete warn "N productos"). Verify: component test rejects empty name with Spanish message. Implements: supplier-management.
- [x] 2.4 TDD `src/features/products/api.ts`: create/update (title required; customProps unique non-empty keys), `deleteProduct` cascade (movements + cart items + list memberships, one `db.transaction`, Spanish confirm in UI), `duplicateProduct` (copy fields + purchase info, title "(copia)", stock zeroed, no movements). Verify: unit tests cover product-catalog CRUD/duplicate/custom-prop scenarios. Implements: product-catalog.
- [x] 2.5 Product screens `src/features/products/` (list + area `<datalist>` from distinct areas, ProductForm with image pick → downscale → replace/remove, ProductDetail "datos" + image placeholder). Verify: component tests — empty title rejected (Spanish), placeholder renders without image. Implements: product-catalog.

## Batch 3 — Inventory + Movements (slice 3)

- [x] 3.1 TDD `src/features/inventory/api.ts` `setStock`: current/min/max non-negative, min ≤ max when both set, min/max nullable, one free-text location. Verify: unit tests per inventory stock scenarios. Implements: inventory-management.
- [x] 3.2 TDD `registerMovement`: entrada delta=+qty; salida delta=-qty (qty > current rejected, stock unchanged); ajuste qty=target, delta=target-current; movement record + embedded stock update in one transaction. Verify: unit tests cover all 4 movement scenarios. Implements: inventory-management.
- [x] 3.3 Bitácora: `getMovements(productId)` sorted date desc; export no movement update/delete functions (append-only). Verify: unit test ordering; api exports contain no mutation. Implements: inventory-management bitácora.
- [x] 3.4 Inventory UI on ProductDetail (`src/features/inventory/`: stock form, Entrada/Salida/Ajuste form, bitácora list with no edit/delete controls). Verify: component test — salida over stock shows Spanish error; bitácora offers no edit/delete. Implements: inventory-management.

## Batch 4 — Purchase Planning (slice 4)

- [x] 4.1 TDD `src/lib/dates.ts`: `today()`, `addPeriod(date, 'semanal'|'quincenal'|'mensual')` with month-end clamp (2026-01-31 + mensual → 2026-02-28), `isDue(next)` (string compare). Verify: unit tests incl. weekly 2026-09-01 → 2026-09-08 and overflow. Implements: purchase-planning period.
- [x] 4.2 TDD `src/lib/money.ts` (parse "25.50" → 2550 centavos; format via `Intl.NumberFormat('es-MX', MXN)`) and `src/lib/id.ts` (unique ids for links). Verify: unit tests. Implements: purchase-planning prices.
- [x] 4.3 TDD `src/features/purchase/api.ts` `savePurchaseInfo`: prices ≥ 0 (reject negative), URL validation for links, period set → next = addPeriod(last, period), period none → next unset, lastPurchaseDate update recomputes next. Verify: unit tests cover record/negative-price/weekly/unset/recompute scenarios. Implements: purchase-planning.
- [x] 4.4 Purchase UI on ProductDetail ("Info de compra"): primary/secondary supplier selects, original/last price (MXN), `type="date"` dates, period select, links add + open. Verify: component test — negative price rejected with Spanish message. Implements: purchase-planning.

## Batch 5 — Carts + Buy Cart + Auto-generation (slice 5)

- [ ] 5.1 TDD `src/features/carts/api.ts` lifecycle: `createCart` (manual, active), `cancelCart` (cancelled, history retained), multiple active carts allowed. Verify: unit tests per lifecycle scenarios. Implements: cart-management.
- [ ] 5.2 TDD cart items: add/update (qty > 0, unitPrice ≥ 0, default supplier = product's primary, editable), remove; items as array in Cart. Verify: unit tests per item-grouping scenarios. Implements: cart-management.
- [ ] 5.3 TDD `buyCart` atomic in one `db.transaction('rw', ...)`: per item entrada movement + product.purchase{lastPrice, lastPurchaseDate=today, next=addPeriod(...)} + cart.status='purchased'; inject failure → assert full rollback (no partial state). Verify: unit tests cover both buy-cart scenarios. Implements: cart-management.
- [ ] 5.4 TDD `generateAutoCart`: due = nextPurchaseDate ≤ today AND not in any active cart; group by primary supplier else "Sin proveedor"; defaults qty 1, unitPrice = lastPrice ?? 0; none due → no-op. Verify: unit tests cover all 3 auto-generation scenarios. Implements: cart-management.
- [ ] 5.5 Wire auto-cart in `src/app/App.tsx` root useEffect (run-once guard) + carts screens (`/carts` list, `/carts/:id` grouped by supplier, "Pagar carrito"/"Cancelar carrito"/"Generar carrito"). Verify: component test — items render under supplier group headings; buy-button smoke. Implements: cart-management.

## Batch 6 — Lists + Reports + PWA Gate (slice 6)

- [ ] 6.1 TDD `src/features/lists/api.ts`: create/rename (title required), `deleteList` (products preserved), `addMember` (reject duplicate), `removeMember`. Verify: unit tests cover all 6 shopping-lists scenarios. Implements: shopping-lists.
- [ ] 6.2 Lists screens (`/lists`, `/lists/:id` membership add/remove) + "listas" section on ProductDetail. Verify: component tests — empty title and duplicate membership rejected with Spanish messages. Implements: shopping-lists.
- [ ] 6.3 TDD `src/features/reports/api.ts`: `outOfStock` (current ≤ min, min set, shortfall desc), `upcomingPurchases` (scheduled only, next date asc, overdue first). Verify: unit tests cover all 5 reporting scenarios. Implements: reporting.
- [ ] 6.4 Inicio screen `/` (`src/features/reports/`): Faltantes + Próximas compras cards via `useLiveQuery`, es-MX dates, MXN. Verify: component test with fixtures asserts ordering + exclusions. Implements: reporting.
- [ ] 6.5 Final gate: `npm test`, `npm run build`, `npx tsc --noEmit` green; manual PWA checklist — installable (browser install prompt), offline start with data, image upload on device, buy-cart happy path. Implements: proposal success criteria.
