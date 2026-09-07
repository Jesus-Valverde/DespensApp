# Delta for product-catalog

## ADDED Requirements

### Requirement: Product CRUD

The system MUST allow creating, viewing, editing, and deleting products. A product MUST have a title (`nombre`); brand (`marca`), content size (`contenido`), and area (`área`) are optional free-text fields. Product identifiers and data storage MUST be in English; user-facing labels MUST be in Spanish.

#### Scenario: Create product with required title only

- GIVEN the product creation form ("Nuevo producto") is open
- WHEN the user enters only a title "Leche entera" and saves
- THEN the product is stored and visible in the catalog
- AND its brand, content size, and area are empty

#### Scenario: Reject product without title

- GIVEN the product creation form is open
- WHEN the user saves with an empty title
- THEN the system rejects the save and shows a Spanish validation message
- AND no product is created

#### Scenario: Edit product

- GIVEN a product "Leche entera" exists
- WHEN the user changes its brand to "Alpura" and saves
- THEN the catalog shows the updated brand

#### Scenario: Delete product cascades with confirmation

- GIVEN a product has inventory, purchase info, and appears in a cart
- WHEN the user deletes the product and confirms the Spanish confirmation dialog
- THEN the product, its inventory, purchase info, and cart/list memberships are removed

### Requirement: Duplicate product

The system MUST allow duplicating an existing product into a new product that copies all fields (brand, content size, area, custom properties, purchase info) but not inventory quantities, movement history, or active cart/list memberships. The duplicate MUST have a distinct title, defaulted to the original with a suffix (e.g. "(copia)").

#### Scenario: Duplicate a product

- GIVEN a product "Detergente" with brand and purchase info exists
- WHEN the user triggers "Duplicar"
- THEN a new product "Detergente (copia)" is created with the same brand and purchase info
- AND its inventory quantities start at zero with no movement history

### Requirement: Custom key-value properties

The system MUST allow attaching zero or more user-defined key-value properties to a product (e.g. "Pagar con tarjeta" = "sí"). The system MUST NOT provide dedicated fields for such attributes; they are free-form. Keys MUST be non-empty; duplicate keys on the same product MUST be rejected.

#### Scenario: Add custom property

- GIVEN a product edit form is open
- WHEN the user adds key "Pagar con tarjeta" with value "sí" and saves
- THEN the property is stored and displayed on the product detail

#### Scenario: Reject duplicate key

- GIVEN a product already has property "Pagar con tarjeta"
- WHEN the user adds another property with the same key
- THEN the system rejects it with a validation message

### Requirement: Product image

The system MUST allow attaching an optional image to a product from the device. Images MUST be downscaled before local storage and MUST never be required. The user MUST be able to replace or remove the image.

#### Scenario: Upload and downscale image

- GIVEN a product edit form is open
- WHEN the user selects a large photo from the device
- THEN the image is downscaled and stored locally, and displayed on the product

#### Scenario: Product without image

- GIVEN a product is created without selecting an image
- THEN the product is saved successfully and shows a placeholder
