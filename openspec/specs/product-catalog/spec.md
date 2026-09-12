# Product Catalog Specification

## Purpose

Defines the product catalog: product fields and CRUD, visual identity, family grouping, duplication, custom properties, catalog browsing, and the product-detail surfaces for stock and purchase. Stock and purchase semantics live in their own specs (inventory-management, purchase-planning, supplier-management, cart-management); this spec covers them from the product perspective only. UI labels are Spanish; stored identifiers are English.

## Requirements

### Requirement: Product fields and CRUD

The system MUST allow creating, viewing, editing, and deleting products. A product MUST have a title (`nombre`). Optional free-text fields: brand (`marca`), content size (`contenido`), area (`área`), family (`familia`), model/variant (`modelo`), and description (`descripción`). Saving without a title MUST be rejected with a Spanish message.

#### Scenario: Create with title only

- GIVEN the "Nuevo producto" form is open
- WHEN the user enters "Leche entera" and saves
- THEN the product is stored with all optional fields empty

#### Scenario: Reject empty title

- GIVEN the product form is open
- WHEN the user saves with an empty title
- THEN a Spanish validation message is shown and no product is created

### Requirement: Family grouping

The family field MUST offer existing distinct families as suggestions. The catalog search MUST match family, and the product detail MUST show the family as a badge. Duplication MUST copy the family.

#### Scenario: Family suggestions

- GIVEN products exist with families "Leche" and "Cereal"
- WHEN the user opens the family field on the form
- THEN "Leche" and "Cereal" are offered as suggestions

### Requirement: Visual identity

A product MUST support an optional device image OR an optional icon with background tone (searchable icon grid). Choosing one MUST clear the other. Images MUST be downscaled before local storage, MUST be replaceable and removable, and MUST never be required. Without image or icon, a placeholder MUST be shown.

#### Scenario: Image and icon are exclusive

- GIVEN a product form with an image attached
- WHEN the user picks an icon
- THEN the icon is stored and the image is cleared

#### Scenario: Placeholder without visual

- GIVEN a product without image or icon
- THEN the catalog and detail show a default placeholder

### Requirement: Duplicate product

"Crear copia" MUST create a product copying all fields, custom properties, purchase info (including per-supplier metadata), and stock configuration (min, max, location) — with current stock zeroed, no movement history, and no cart or list memberships. The title MUST default to the original plus " (copia)".

#### Scenario: Duplicate copies config, not history

- GIVEN "Detergente" has brand, purchase info, min 1 / max 5, and movements
- WHEN the user triggers "Crear copia"
- THEN "Detergente (copia)" has the same brand, purchase info, and min/max
- AND current stock 0 and no movement history

### Requirement: Custom properties

Products MAY carry free-form key-value properties (e.g. "Pagar con tarjeta" = "sí"), editable from the product form and from the detail's properties modal. Keys MUST be non-empty; duplicate keys on the same product MUST be rejected.

#### Scenario: Add property from detail

- GIVEN the "Editar propiedades" modal is open
- WHEN the user adds "Pagar con tarjeta" = "sí" and saves
- THEN the detail shows the property

#### Scenario: Reject duplicate key

- GIVEN the product already has "Pagar con tarjeta"
- WHEN the user adds the same key again
- THEN the system rejects it with a validation message

### Requirement: Catalog browsing

The catalog screen MUST list products sorted by title, show the total product count, offer search over title, brand, family, and area, and show empty and no-results states in Spanish.

#### Scenario: Search filters the catalog

- GIVEN products "Leche entera" and "Atún"
- WHEN the user searches "leche"
- THEN only "Leche entera" is listed

### Requirement: Product detail structure

The detail MUST show a hero card (visual, family badge, title, brand) with actions Editar, "Crear copia", and Eliminar, plus section tabs Datos, Stock, and Compra. Datos MUST list stored fields (including model, description, and product ID) as key-value rows with an edit action.

#### Scenario: Datos tab

- GIVEN a product with family, model, and description
- WHEN the user opens the Datos tab
- THEN those fields and the product ID are shown as key-value rows

### Requirement: Stock surface on the detail

The Stock tab MUST show current/min/max/location and recent movements, MUST let the user edit levels and register Entrada/Salida/Ajuste through a quantity-stepper modal, and MUST open a full history view ("Historial de movimientos") filterable by movement type. Movement semantics follow inventory-management.

#### Scenario: Register entrada from detail

- GIVEN a product with stock 4
- WHEN the user registers "Entrada" of 6 from the Stock tab
- THEN stock becomes 10 and the movement is recorded

#### Scenario: Filter history by type

- GIVEN movements of several types exist
- WHEN the user filters the history by "Salida"
- THEN only salida movements are listed

### Requirement: Purchase surface on the detail

The Compra tab MUST show the product's purchase info (per purchase-planning) and open a suppliers modal to link primary and secondary suppliers with per-supplier price, frequency, URL, and notes, including a "Ver proveedor" action to the supplier screen. It MUST offer an add-to-cart action (per cart-management) with cart selection, quantity stepper, and inline cart creation.

#### Scenario: Per-supplier metadata

- GIVEN the suppliers modal is open for a product
- WHEN the user sets a supplier price of 28 and frequency "semanal"
- THEN the metadata is stored for that supplier and shown on the tab

#### Scenario: Add to cart from detail

- GIVEN an active cart exists
- WHEN the user adds the product with quantity 2 from the Compra tab
- THEN the item is created in the chosen cart

### Requirement: Delete cascade

Deleting a product MUST require a Spanish confirmation showing the counts of linked lists and suppliers, and MUST remove in one transaction the product, its movements, its cart items (including items in purchased and cancelled history carts), and its list memberships.

#### Scenario: Cascade includes history carts

- GIVEN a product appears in an active cart and in a purchased cart
- WHEN the user deletes the product and confirms
- THEN both carts no longer reference the product
- AND its movements and list memberships are removed
