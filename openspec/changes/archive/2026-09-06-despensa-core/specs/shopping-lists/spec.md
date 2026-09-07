# Delta for shopping-lists

## ADDED Requirements

### Requirement: List CRUD

The system MUST allow creating, renaming, and deleting lists. A list MUST have a non-empty title (`nombre`). Deleting a list MUST NOT delete its member products. A product MAY belong to zero or more lists, and a list MAY contain zero or more products.

#### Scenario: Create list

- GIVEN the lists screen is open
- WHEN the user creates a list "Para el viaje"
- THEN the list appears with zero products

#### Scenario: Reject empty list title

- GIVEN the list creation form is open
- WHEN the user saves with an empty title
- THEN the system rejects the save with a Spanish validation message

#### Scenario: Delete list preserves products

- GIVEN a list contains products
- WHEN the user deletes the list and confirms
- THEN the list is removed and the products remain in the catalog

### Requirement: Manage list membership

The system MUST allow adding a product to a list and removing it from a list. Adding the same product twice to one list MUST be rejected.

#### Scenario: Add product to list

- GIVEN a list "Para el viaje" exists
- WHEN the user adds product "Atún"
- THEN "Atún" appears in the list

#### Scenario: Reject duplicate membership

- GIVEN "Atún" is already in list "Para el viaje"
- WHEN the user adds "Atún" to the same list again
- THEN the system rejects the duplicate with a validation message

#### Scenario: Remove product from list

- GIVEN "Atún" is in list "Para el viaje"
- WHEN the user removes it
- THEN the list no longer contains "Atún" and the product stays in the catalog
