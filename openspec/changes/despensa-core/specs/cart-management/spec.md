# Delta for cart-management

## ADDED Requirements

### Requirement: Cart lifecycle with multiple carts

The system MUST support multiple carts, each with a status: active ("Activo"), purchased ("Comprado"), or cancelled ("Cancelado"). Multiple active carts MUST be allowed simultaneously. Purchased and cancelled carts MUST be retained as history.

#### Scenario: Create manual cart

- GIVEN the carts screen is open
- WHEN the user creates a cart named "Súper de la semana"
- THEN a new active cart appears

#### Scenario: Cancel cart keeps history

- GIVEN an active cart with items
- WHEN the user cancels it ("Cancelar carrito") and confirms
- THEN its status becomes "Cancelado" and it remains viewable in history

### Requirement: Cart items grouped by supplier

Each cart item MUST reference a product, a quantity, a unit price, and a supplier (denormalized from the product's primary supplier by default, editable per item). Items MUST be grouped by supplier both visually in the UI and logically in the data model. Item quantities MUST be positive; prices MUST be non-negative MXN.

#### Scenario: Add item with default supplier

- GIVEN an active cart and a product whose primary supplier is "Bodega Aurrerá"
- WHEN the user adds the product with quantity 2
- THEN the item appears under the "Bodega Aurrerá" group

#### Scenario: Group items by distinct suppliers

- GIVEN a cart contains items for suppliers "Bodega Aurrerá" and "Costco"
- WHEN the user views the cart
- THEN items are displayed in separate per-supplier groups

### Requirement: Buy cart atomic side effects

Buying a cart ("Pagar carrito") MUST perform all of the following as one atomic all-or-nothing operation: (1) register an "Entrada" movement per item with the item quantity, (2) update the product's last price and last purchase date from the item, (3) recompute the next purchase date from the period, and (4) mark the cart as purchased. If any step fails, no partial changes MAY persist.

#### Scenario: Buy cart updates stock, prices, and dates

- GIVEN an active cart has item: product "Leche entera", quantity 6, unit price 28.00
- WHEN the user taps "Pagar carrito"
- THEN the product stock increases by 6 with an "Entrada" movement
- AND its last price becomes 28.00 MXN, last purchase date is today
- AND its next purchase date is recomputed from its period
- AND the cart status becomes "Comprado"

#### Scenario: Buy cart failure leaves no partial state

- GIVEN buying a cart fails mid-operation (e.g. storage error)
- WHEN the failure occurs
- THEN no stock movement, price update, or status change persists

### Requirement: Auto-generated carts

The system MUST generate cart contents automatically from scheduled products whose next purchase date is today or earlier. Generation MUST run on app open and via a manual trigger button ("Generar carrito"); push notifications MUST NOT be used. Generated items MUST be grouped by each product's primary supplier; products without a primary supplier MUST be grouped under "Sin proveedor". A product already in an active cart MUST NOT be duplicated into a new one.

#### Scenario: Auto-generate on app open

- GIVEN products with next purchase dates 2026-09-01 and 2026-09-06 (today)
- WHEN the app is opened on 2026-09-06
- THEN a generated cart contains both products grouped by primary supplier

#### Scenario: Manual trigger

- GIVEN no carts have been generated today
- WHEN the user taps "Generar carrito"
- THEN a new cart with all due products is created

#### Scenario: No duplicate into active cart

- GIVEN product "Detergente" is due and already in an active cart
- WHEN auto-generation runs
- THEN "Detergente" is not added to the new cart
