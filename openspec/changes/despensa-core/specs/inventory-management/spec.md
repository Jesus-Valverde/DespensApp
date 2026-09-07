# Delta for inventory-management

## ADDED Requirements

### Requirement: Single global stock per product

Each product MUST have exactly one global stock record with current quantity (`cantidad actual`), minimum quantity (`mínimo`), maximum quantity (`máximo`), and one free-text location (`ubicación`, e.g. "refri", "alacena"). Stock MUST NOT be tracked per location; the location is a descriptive field only.

#### Scenario: Set stock levels and location

- GIVEN a product "Leche entera" exists
- WHEN the user sets current 6, min 2, max 12, location "refri"
- THEN the inventory record shows those values

#### Scenario: Reject negative quantities

- GIVEN an inventory edit form is open
- WHEN the user saves current/min/max of -1
- THEN the system rejects the save with a Spanish validation message

#### Scenario: Reject min greater than max

- GIVEN an inventory edit form with max 5
- WHEN the user saves min 8
- THEN the system rejects the save with a validation message

### Requirement: Movements (entrada / salida / ajuste)

The system MUST support three movement types on a product's stock: "Entrada" (adds quantity), "Salida" (subtracts quantity), and "Ajuste" (sets absolute quantity). Each movement MUST be recorded with timestamp, type, quantity (or resulting quantity for ajuste), and the resulting stock.

#### Scenario: Entrada increases stock

- GIVEN a product has current stock 4
- WHEN an "Entrada" of 6 is registered
- THEN current stock becomes 10 and a movement record shows the resulting stock

#### Scenario: Salida decreases stock

- GIVEN a product has current stock 10
- WHEN a "Salida" of 3 is registered
- THEN current stock becomes 7

#### Scenario: Salida exceeding stock is rejected

- GIVEN a product has current stock 2
- WHEN a "Salida" of 5 is attempted
- THEN the system rejects it with a validation message and stock stays at 2

#### Scenario: Ajuste sets absolute stock

- GIVEN a product has current stock 2
- WHEN an "Ajuste" to 9 is registered (physical recount)
- THEN current stock becomes 9 and the movement log records the delta (+7)

### Requirement: Append-only movement log (bitácora)

The system MUST keep an append-only movement log per product. Movement entries MUST NOT be editable or deletable through the UI. The log MUST be viewable per product ("Bitácora") in reverse chronological order.

#### Scenario: Movement cannot be edited or deleted

- GIVEN a product has at least one movement entry
- WHEN the user views the bitácora
- THEN no edit or delete action is offered for any entry

#### Scenario: Movements preserved on product edit

- GIVEN a product has movements
- WHEN the user edits the product's catalog fields (title, brand)
- THEN all movement entries remain unchanged
