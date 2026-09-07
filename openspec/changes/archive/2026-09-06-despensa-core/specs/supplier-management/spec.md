# Delta for supplier-management

## ADDED Requirements

### Requirement: Supplier CRUD

The system MUST allow creating, viewing, editing, and deleting suppliers. A supplier MUST have a name (`nombre`); a type (`tipo`, e.g. supermarket, wholesale, online) and one or more locations (`ubicaciones`, free text) are optional.

#### Scenario: Create supplier

- GIVEN the supplier form ("Nuevo proveedor") is open
- WHEN the user enters name "Bodega Aurrerá", type "Supermercado", location "Centro" and saves
- THEN the supplier is stored and listed

#### Scenario: Reject supplier without name

- GIVEN the supplier form is open
- WHEN the user saves with an empty name
- THEN the system rejects the save with a Spanish validation message

#### Scenario: Edit supplier

- GIVEN a supplier "Bodega Aurrerá" exists
- WHEN the user adds a second location "Norte" and saves
- THEN the supplier shows both locations

### Requirement: Delete supplier with reference handling

Deleting a supplier that is referenced by products' purchase info MUST warn the user with the number of affected products. On confirmation, the supplier MUST be deleted and all primary/secondary references to it MUST be cleared; other purchase info fields MUST be preserved.

#### Scenario: Delete referenced supplier

- GIVEN supplier "Bodega Aurrerá" is the primary supplier of 3 products
- WHEN the user deletes it and confirms the warning "3 productos"
- THEN the supplier is deleted and those products have no primary supplier
- AND their prices, dates, and period remain unchanged

#### Scenario: Delete unreferenced supplier

- GIVEN a supplier is not referenced by any product
- WHEN the user deletes it
- THEN the supplier is removed with a simple confirmation
