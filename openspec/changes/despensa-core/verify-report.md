# Verification Report — despensa-core

**Change**: despensa-core
**Version**: spec deltas as committed (6c4bfde)
**Mode**: Strict TDD (active per `openspec/config.yaml` `strict_tdd: true`)
**Date**: 2026-09-06
**Verifier**: sdd-verify executor (read-only audit; no code changed)

## Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 28 |
| Tasks complete | 28 |
| Tasks incomplete | 0 |

`grep` evidence: 28 lines matching `- [x]`, 0 matching `- [ ]` in `openspec/changes/despensa-core/tasks.md`.

## Build & Tests Execution (re-run by verifier, 2026-09-06)

**Tests**: ✅ 173 passed / 0 failed / 0 skipped — `npm test` (Vitest 5, happy-dom + fake-indexeddb)
```text
Test Files  27 passed (27)
     Tests  173 passed (173)
  Duration  8.49s
```

**Typecheck**: ✅ Passed — `npm run typecheck` (`tsc -b`), exit code 0, no output.

**Build**: ✅ Passed — `npm run build` (`tsc -b && vite build`), exit code 0.
```text
vite v8.2.2 — 54 modules transformed
dist/registerSW.js, dist/manifest.webmanifest, dist/sw.js, dist/workbox-*.js
PWA v1.3.0 mode generateSW — precache 10 entries (395.03 KiB)
```

**Coverage**: ➖ Not available — no coverage tool installed (`openspec/config.yaml` documents the plan to add `vitest --coverage`). Coverage analysis skipped; not a failure.

## Spec Compliance Matrix

21 requirements / 49 scenarios across the 7 capability deltas. Scenario counts below are counted from the spec files themselves (the Engram spec summary obs 419 says 48 — a 1-scenario summary drift in the memory artifact, not in the specs).

### product-catalog (4 req / 9 scenarios)

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Product CRUD | Create product with required title only | `src/features/products/api.test.ts:10` | ✅ COMPLIANT |
| Product CRUD | Reject product without title | `api.test.ts:27` + `ProductForm.test.tsx:27` (Spanish alert + `db.products.count() === 0`) | ✅ COMPLIANT |
| Product CRUD | Edit product | `api.test.ts:67` (brand "Alpura" persisted; stock/purchase/createdAt kept) | ✅ COMPLIANT |
| Product CRUD | Delete product cascades with confirmation | `api.test.ts:111` (movements + cart items + list memberships in one tx) + `ProductDetail.test.tsx:84` (Spanish confirm) | ✅ COMPLIANT |
| Duplicate product | Duplicate a product | `api.test.ts:164` ("(copia)", purchase info copied, stock 0, no movements) + `ProductDetail.test.tsx:71` (UI) | ✅ COMPLIANT |
| Custom key-value properties | Add custom property | `api.test.ts:33` + `ProductDetail.test.tsx:35` ("Pagar con tarjeta: sí" displayed) | ✅ COMPLIANT |
| Custom key-value properties | Reject duplicate key | `api.test.ts:53` + `ProductForm.test.tsx:41` ("Ya existe la propiedad…") | ✅ COMPLIANT |
| Product image | Upload and downscale image | `src/lib/image.test.ts:52,67,77` (max 512px, JPEG q=0.8, no upscale) + `ProductForm.test.tsx:84` (downscale called, preview, "Quitar imagen") | ✅ COMPLIANT |
| Product image | Product without image | `ProductDetail.test.tsx:35` ("Sin imagen" placeholder, no `img` role) | ✅ COMPLIANT |

### inventory-management (3 req / 9 scenarios)

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Single global stock | Set stock levels and location | `src/features/inventory/api.test.ts:12` (6/2/12/"refri") | ✅ COMPLIANT |
| Single global stock | Reject negative quantities | `api.test.ts:20` (Spanish "negativas", stock unchanged) | ✅ COMPLIANT |
| Single global stock | Reject min greater than max | `api.test.ts:30` + `InventorySections.test.tsx:56` (Spanish error) | ✅ COMPLIANT |
| Movements | Entrada increases stock | `api.test.ts:53` (4+6=10, movement with resultingQty) | ✅ COMPLIANT |
| Movements | Salida decreases stock | `api.test.ts:72` (10-3=7, delta -3) | ✅ COMPLIANT |
| Movements | Salida exceeding stock is rejected | `api.test.ts:83` + `InventorySections.test.tsx:108` (Spanish error, stock stays 2, no movement written) | ✅ COMPLIANT |
| Movements | Ajuste sets absolute stock | `api.test.ts:104` (2→9, delta +7) + `InventorySections.test.tsx:91` | ✅ COMPLIANT |
| Append-only log | Movement cannot be edited or deleted | `InventorySections.test.tsx:37` (no button/Editar/Eliminar in Bitácora region) + `api.test.ts:173` (module exports no mutation) | ✅ COMPLIANT |
| Append-only log | Movements preserved on product edit | `api.test.ts:180` (movements equal after title/brand update) | ✅ COMPLIANT |

### supplier-management (2 req / 5 scenarios)

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Supplier CRUD | Create supplier | `src/features/suppliers/api.test.ts:34` + `SuppliersScreen.test.tsx:41` | ✅ COMPLIANT |
| Supplier CRUD | Reject supplier without name | `api.test.ts:48` + `SuppliersScreen.test.tsx:31` (Spanish message) | ✅ COMPLIANT |
| Supplier CRUD | Edit supplier | `api.test.ts:67` (both locations shown) | ✅ COMPLIANT |
| Delete with reference handling | Delete referenced supplier | `api.test.ts:79` (3 affected, refs cleared in one tx, prices/dates/period preserved) + `SuppliersScreen.test.tsx:55` (confirm "3 productos") | ✅ COMPLIANT |
| Delete with reference handling | Delete unreferenced supplier | `api.test.ts:147` (0 affected, simple delete) | ✅ COMPLIANT |

### purchase-planning (4 req / 6 scenarios)

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Purchase info per product | Record purchase info | `src/features/purchase/api.test.ts:12` + `PurchaseSection.test.tsx:30` ("Info de compra" form) | ✅ COMPLIANT |
| Purchase info per product | Reject negative price | `api.test.ts:38` + `PurchaseSection.test.tsx:57` (Spanish "negativo", nothing saved) | ✅ COMPLIANT |
| Period scheduling | Set weekly period | `api.test.ts:65` (2026-09-01 → 2026-09-08) + `PurchaseSection.test.tsx:74` + `src/lib/dates.test.ts:21` | ✅ COMPLIANT |
| Period scheduling | Unset period makes product unscheduled | `api.test.ts:78` (next unset) + `reports/api.test.ts:42` (report exclusion) + `carts/api.test.ts:441` (auto-cart exclusion) | ✅ COMPLIANT |
| Recompute on purchase | Recompute after date update | `api.test.ts:100` (quincenal 2026-09-06 → 2026-09-20) | ✅ COMPLIANT |
| Purchase links | Open purchase link | `PurchaseSection.test.tsx:53-54` (anchor role "Abrir" with href) + URL validation `api.test.ts:130,147` | ✅ COMPLIANT |

### cart-management (4 req / 9 scenarios)

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Cart lifecycle | Create manual cart | `src/features/carts/api.test.ts:30` + `CartForm.test.tsx:34` | ✅ COMPLIANT |
| Cart lifecycle | Cancel cart keeps history | `api.test.ts:51` (status cancelled, items retained) + `CartDetail.test.tsx:148` (dismissed confirm keeps active) | ✅ COMPLIANT |
| Items grouped by supplier | Add item with default supplier | `api.test.ts:94` (denormalized primary supplier + lastPrice) | ✅ COMPLIANT |
| Items grouped by supplier | Group items by distinct suppliers | `api.test.ts:225` (`groupCartItems`) + `CartDetail.test.tsx:51` (per-supplier region headings) | ✅ COMPLIANT |
| Buy cart atomic | Buy cart updates stock, prices, dates | `api.test.ts:279` (spec values: qty 6, price 2800 → entrada, lastPrice/lastPurchaseDate=today, next recomputed, purchased) | ✅ COMPLIANT |
| Buy cart atomic | Buy cart failure leaves no partial state | `api.test.ts:339` (2nd movements.add rejected → 0 movements, stock/prices/status all unchanged) | ✅ COMPLIANT |
| Auto-generated carts | Auto-generate on app open | `api.test.ts:409` (due 2026-09-01 + 2026-09-06 grouped by supplier) + wiring `src/app/App.tsx:22-28` (run-once root useEffect) | ✅ COMPLIANT |
| Auto-generated carts | Manual trigger | `CartsScreen.test.tsx:45` ("Generar carrito" creates auto cart) | ✅ COMPLIANT |
| Auto-generated carts | No duplicate into active cart | `api.test.ts:441,454` (covered product skipped; purchased/cancelled carts do not block) | ✅ COMPLIANT |

### shopping-lists (2 req / 6 scenarios)

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| List CRUD | Create list | `src/features/lists/api.test.ts:103` + `ListsScreen.test.tsx:34` ("0 productos") | ✅ COMPLIANT |
| List CRUD | Reject empty list title | `api.test.ts:110` + `ListsScreen.test.tsx:24` (Spanish message) | ✅ COMPLIANT |
| List CRUD | Delete list preserves products | `api.test.ts:33` + `ListDetail.test.tsx:79` (confirm, products remain) | ✅ COMPLIANT |
| Membership | Add product to list | `api.test.ts:53` + `ListDetail.test.tsx:58` + `ListsSection.test.tsx:58` | ✅ COMPLIANT |
| Membership | Reject duplicate membership | `api.test.ts:62` + `ListDetail.test.tsx:43` ("El producto ya está en la lista") | ✅ COMPLIANT |
| Membership | Remove product from list | `api.test.ts:81` + `ListDetail.test.tsx:58` + `ListsSection.test.tsx:42` | ✅ COMPLIANT |

### reporting (2 req / 5 scenarios)

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Out-of-stock report | Product at or below minimum appears | `src/features/reports/api.test.ts:56` (current 2 = min 2, with shortfall) | ✅ COMPLIANT |
| Out-of-stock report | Product above minimum excluded | `api.test.ts:68` (also excludes min===null) | ✅ COMPLIANT |
| Out-of-stock report | Ordered by severity | `api.test.ts:77` (shortfall desc, es title tiebreak) | ✅ COMPLIANT |
| Upcoming purchases | Overdue items listed first | `api.test.ts:20` (2026-09-01 before 2026-09-10) + `InicioScreen.test.tsx:56` ("Vencida" badge) | ✅ COMPLIANT |
| Upcoming purchases | Unscheduled product excluded | `api.test.ts:42` + `InicioScreen.test.tsx:56` | ✅ COMPLIANT |

**Compliance summary**: 49/49 scenarios COMPLIANT (passing covering test at runtime + source inspection). No UNTESTED, no FAILING, no PARTIAL.

## Correctness (Static Evidence)

| Area | Status | Notes |
|------|--------|-------|
| Dexie schema | ✅ Implemented | `src/db/db.ts:13-19` — 5 stores exactly per design; `db.test.ts` asserts table set + opens under fake-indexeddb |
| Spanish validation at trust boundary | ✅ Implemented | Every `api.ts` throws Spanish `Error`; forms catch → `<p role="alert">` (e.g. `ProductForm.tsx:214-218`) |
| Buy-cart single transaction | ✅ Implemented | `carts/api.ts:190-226` — one `db.transaction('rw', …)` wrapping movements, purchase updates, status; rollback test proves atomicity |
| Auto-cart dedupe guard | ✅ Implemented | `carts/api.ts:234-281` — due = `isDue(next)` AND not in any active cart; "Sin proveedor" bucket; null when none due |
| Money as integer centavos | ✅ Implemented | `lib/money.ts` (parse/format, `Intl` es-MX MXN); UI converts "31.5" → 3150 (`CartDetail.test.tsx:98`) |
| Date strings + month-end clamp | ✅ Implemented | `lib/dates.ts:37-47` (2026-01-31 + mensual → 2026-02-28; leap year 2028-02-29 tested) |
| Append-only bitácora | ✅ Implemented | `inventory/api.ts:103-106` read-only query; no mutation exported |
| Image downscale | ✅ Implemented | `lib/image.ts` max 512, JPEG q=0.8, bitmap.close() in finally; never upscales |
| PWA config | ✅ Implemented | `vite.config.ts` — autoUpdate, manifest `lang: es` / standalone, workbox precache + navigateFallback; build emits sw.js + manifest |

## Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| 1. Tailwind v4 via @tailwindcss/vite | ✅ Yes | `vite.config.ts`; `src/index.css` imports tailwindcss |
| 2. Feature folders, HashRouter, no state lib | ✅ Yes | `src/app/App.tsx` (HashRouter), `useLiveQuery` reads throughout |
| 3. Dexie schema: embedded stock/purchase, arrays in parent | ✅ Yes | `src/db/types.ts` matches design data model field-for-field |
| 4. 'YYYY-MM-DD' strings, es-MX Intl, lib/dates | ✅ Yes | Including the documented clamp behavior |
| 5. Integer centavos + Intl MXN | ✅ Yes | `lib/money.ts` |
| 6. Shell: 5 Spanish bottom tabs, max-w-md, FAB | ✅ Yes | `App.test.tsx:8-15` asserts all 5 tabs (scoped to nav region — documented batch-6 deviation) |
| 7. Areas: free text + datalist | ✅ Yes | `ProductForm.tsx:126-140`; `ProductForm.test.tsx:64` |
| 8. Product delete cascade in one tx | ✅ Yes | `products/api.ts:77-97` |
| 9. Auto-cart on open + manual, active-cart idempotency | ✅ Yes | `App.tsx:19-28` + `carts/api.ts:234` |
| 10. Images: bitmap+canvas 512/JPEG 0.8, useObjectUrl | ✅ Yes | `lib/image.ts`, `lib/useObjectUrl.ts` (with create/revoke tests) |
| 11. PWA autoUpdate, placeholder icons, precache | ✅ Yes | Placeholder icons explicitly acknowledged in `docs/PWA-CHECKLIST.md` |
| 12. Testing strategy (unit + component, no E2E) | ✅ Yes | 124 unit + 49 component tests; E2E manual accepted in design |
| 13. Native inputs (number/date) | ✅ Yes | `PurchaseSection`, `MovementForm`, `CartDetail` |

## TDD Compliance (Strict TDD)

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ⚠️ Yes, non-canonical format | obs 426 reports per-task test counts + "all red (module-missing) → green → triangulated" statements; NO literal "TDD Cycle Evidence" table → WARNING (see Issues) |
| All tasks have tests | ✅ | Every implementation task 0.1–6.5 maps to existing test file(s); all re-run and passing |
| RED confirmed (tests exist) | ✅ | All test files cited in obs 426 exist and contain the reported case counts (e.g. 2.2=9, 2.4=13, 5.2=12, 5.3=4, 5.4=6, 6.3=5) |
| GREEN confirmed (tests pass) | ✅ | 173/173 pass on verifier re-run |
| Triangulation adequate | ✅ | Multi-case behaviors triangulated (e.g. addCartItem 6 tests, buyCart 4, dates 7 for addPeriod); validation paths have reject + keep-unchanged companions |
| Safety Net for modified files | ➖ | Cannot be reconstructed post-hoc from artifacts; all batches were sequential feature commits (31 work commits in `git log`), no regressions observed |

**TDD Compliance**: 5/6 checks passed; 1 format deviation (evidence present, table format absent).

## Test Layer Distribution

| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit | 124 | 13 | Vitest + fake-indexeddb (api services, lib utils, db, hook via renderHook) |
| Integration (component) | 49 | 14 | Vitest + @testing-library/react + user-event + happy-dom |
| E2E | 0 | 0 | Not installed — manual checklist per design decision 12 |
| **Total** | **173** | **27** | |

All layers use tools declared in `openspec/config.yaml` testing capabilities — no undeclared tooling.

## Changed File Coverage

Coverage analysis skipped — no coverage tool detected (config documents planned `vitest --coverage`). See SUGGESTION 2.

## Assertion Quality

**Assertion quality**: ✅ All assertions verify real behavior.

Audit across all 27 test files: no tautologies (`expect(true).toBe(true)` etc.), no ghost loops over possibly-empty collections, no smoke-only renders (every render asserts content/behavior), no CSS-class or mock-call-count coupling, mock-to-assertion ratios within bounds (canvas/confirm/URL stubs are environment necessities, each paired with multiple behavioral assertions). Two type-only assertions (`carts/api.test.ts:451` `expect(future).toBeDefined()`, `suppliers/api.test.ts:37` `typeof id`) appear inside tests that also carry value assertions — allowed per audit rules. Error paths consistently assert BOTH the Spanish message AND unchanged persisted state (e.g. `api.test.ts` products:27-31, inventory:83-91, purchase:38-63).

## Quality Metrics

**Linter**: ➖ Not available (planned eslint per config)
**Type Checker**: ✅ No errors — `tsc -b` exit 0

## Issues Found

**CRITICAL**: None.

**WARNING**:
1. **TDD evidence format deviation** — apply-progress (obs 426) reports TDD evidence per task (counts + red→green→triangulated statements) but not in the canonical "TDD Cycle Evidence" table (RED/GREEN/TRIANGULATE/SAFETY NET/REFACTOR columns). The CRITICAL trigger in the strict-TDD module applies when apply "did not report TDD evidence"; evidence was reported and every claim was independently re-verified (files exist, counts match, all green), so this is graded WARNING. Recommend future apply phases emit the canonical table.
2. **PWA manual checklist not yet executed** — `docs/PWA-CHECKLIST.md` is authored with all 10 items unchecked (☐). Build evidence exists (sw.js, manifest.webmanifest, 10 precache entries, `lang: es`, standalone), but the proposal success criterion "Installable PWA, offline, all data local" and task 6.5's manual items (install prompt, offline start with data, device image upload, buy-cart happy path) require a human run on desktop Chromium/Firefox + one Android device. Design explicitly accepts manual E2E ("Manual checklist in verify phase"), so this does not break a spec — but it should be executed before the change is distributed, and ideally before archive.

**SUGGESTION**:
1. Image tests assert `blob.type` only (documented happy-dom limitation, obs 426 batch 2 #7) — JPEG bytes are not verified. Acceptable; consider a byte-level check if a real-canvas environment is ever added.
2. Install `vitest --coverage` (already planned in config) so future verifies can report changed-file coverage.
3. Engram spec summary drift: obs 419 says 48 scenarios; the spec files contain 49 (product-catalog 9 and inventory-management 9, not 8). Specs on disk are the source of truth; no code impact.
4. The app-open auto-cart wiring (`src/app/App.tsx:22-28`) is source-verified + logic unit-tested but has no dedicated component test asserting the effect fires on mount (StrictMode double-invoke covered by run-once flag + active-cart dedupe).

## Deviations Audit (obs 426 vs specs)

All 20 documented deviations reviewed:

| Deviation | Verdict |
|-----------|---------|
| b2#1 Added `src/lib/useObjectUrl.ts` beyond task list | Acceptable — design decision 10 explicitly specifies it; 4 dedicated tests |
| b2#2 `as number` casts on `EntityTable.add` | Acceptable — TypeScript 7 typing workaround, no behavior change |
| b2#3 `updateProduct` re-sets image (clearing when absent) | Acceptable — enables "remove image" (spec); `ProductForm.tsx:36` seeds `product?.image` so a plain edit preserves the photo; covered by `api.test.ts:97` |
| b2#4 `duplicateProduct` zeroes only `stock.current`, keeps min/max/location | Acceptable — spec says "inventory quantities start at zero"; min/max are thresholds, not quantities. Defensible reading, documented |
| b2#5 Post-create/duplicate navigation, delete → /products | Acceptable — UX choice, spec silent |
| b2#6–#7 happy-dom quirks; blob.type-only assertions | Acceptable (test infra); see SUGGESTION 1 |
| b3#1 `setStock` logs no movement | Acceptable — spec scenarios treat stock-form save and movements as separate paths; ajuste is the audited recount path; bitácora requirement is append-only, not all-changes-logged |
| b3#2 extra qty validation | Acceptable — strengthens append-only log integrity |
| b3#3 `movementResult` exported pure | Acceptable — reuse by buyCart; same semantics |
| b3#4 stockState badge / Faltantes cross-view | Acceptable — additive UI |
| b5#1 active-only cart mutation validation | Acceptable — defensive; spec operations target active carts |
| b5#2 buyCart settles price overrides into stored items | Acceptable — history reflects actual paid; consistent with "update last price from the item" |
| b5#3 item mutations wrapped in `db.transaction` | Acceptable — fixes a real race found by test |
| b5#4 buyCart nests registerMovement (Dexie joins parent tx) | Acceptable — atomicity proven by rollback test (`carts/api.test.ts:339`) |
| b5#5 generateAutoCart tx includes suppliers | Acceptable — required for supplier-name resolution in-scope |
| b5#6–#8 pinned-Date testing; blur-commit draft gating; UI pays stored prices | Acceptable — test infra / UI detail |
| b6#1 App tab test scoped to bottom nav | Acceptable — still asserts all 5 Spanish tabs |
| b6#2 InicioScreen computes pure selectors client-side | Acceptable — selectors unit-tested; household scale |
| b6#3 PWA checklist + placeholder icons | See WARNING 2 — checklist authored, execution pending; placeholders were planned in task 0.2 |

No deviation violates a spec requirement or scenario.

## Task Verification (tasks.md "Verify:" criteria)

All 28 task verify criteria re-checked against artifacts: 0.2 build emits SW (re-verified in this build run); 0.3 db test asserts 5 tables; 0.4 App test renders 5 Spanish tabs; 0.5 gates green + `strict_tdd: true` confirmed in config + commit 4c37a28 present; 2.1 image tests (4); 2.2 all 5 supplier scenarios unit-covered; 2.3 empty-name Spanish rejection component-tested; 2.4 13 product api tests; 2.5 empty-title Spanish + no-image placeholder component-tested; 3.1–3.4 stock/movement/bitácora unit + component tests incl. salida-over-stock Spanish error and no edit/delete controls; 4.1 dates tests incl. 2026-09-01→2026-09-08 and month-end clamp; 4.2 money + id tests; 4.3 record/negative/weekly/unset/recompute all covered; 4.4 negative-price Spanish component test; 5.1–5.4 lifecycle/items/buy-rollback/auto-gen unit tests with exact spec values; 5.5 supplier-group headings + buy-button smoke; 6.1 all 6 list scenarios; 6.2 empty-title + duplicate-membership Spanish messages; 6.3 all 5 report scenarios; 6.4 Inicio fixtures assert ordering + exclusions; 6.5 gates green (re-run here) + checklist doc. **All satisfied.**

## Verdict

**PASS WITH WARNINGS**

49/49 spec scenarios compliant with passing covering tests; 28/28 tasks complete with verify criteria satisfied; all three gates green on independent re-run (173/173 tests, typecheck, build+SW). Two warnings remain: non-canonical TDD evidence format (substance verified) and the unexecuted PWA manual checklist, which needs a human on-device pass before distribution.
