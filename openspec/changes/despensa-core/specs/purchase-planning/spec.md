# Delta for purchase-planning

## ADDED Requirements

### Requirement: Purchase info per product

The system MUST allow recording purchase info per product: primary supplier, secondary supplier, original price, last price, last purchase date, next purchase date, and zero or more purchase links (URLs). All prices MUST be non-negative amounts in MXN. Suppliers and links are optional.

#### Scenario: Record purchase info

- GIVEN a product's purchase info form ("Info de compra") is open
- WHEN the user sets primary supplier, original price 25.50, and a purchase link
- THEN the info is stored and displayed on the product

#### Scenario: Reject negative price

- GIVEN the purchase info form is open
- WHEN the user saves original price -1
- THEN the system rejects the save with a validation message

### Requirement: Purchase period scheduling

The system MUST allow setting a purchase period per product: weekly (`semanal`), biweekly (`quincenal`), monthly (`mensual`), or none. The next purchase date MUST be computed as last purchase date plus the period. Products without a period or last purchase date are unscheduled and excluded from auto-cart generation and the upcoming purchases report.

#### Scenario: Set weekly period

- GIVEN a product has last purchase date 2026-09-01
- WHEN the user sets period "semanal"
- THEN the next purchase date is computed as 2026-09-08

#### Scenario: Unset period makes product unscheduled

- GIVEN a product has period "mensual"
- WHEN the user changes the period to none
- THEN the product is excluded from auto-cart generation and the upcoming purchases report

### Requirement: Next date recomputation on purchase

Whenever the last purchase date of a product is updated (including via buying a cart), the system MUST recompute the next purchase date from the period. For unscheduled products the next date MUST remain unset.

#### Scenario: Recompute after date update

- GIVEN a product has period "quincenal" and next purchase date 2026-09-15
- WHEN its last purchase date is updated to 2026-09-06
- THEN the next purchase date becomes 2026-09-20

### Requirement: Purchase links

The system MUST allow storing zero or more purchase links (URLs) per product and opening them from the UI. Invalid or empty URLs MUST be rejected.

#### Scenario: Open purchase link

- GIVEN a product has a purchase link to an online store
- WHEN the user taps the link
- THEN the URL opens in the browser
