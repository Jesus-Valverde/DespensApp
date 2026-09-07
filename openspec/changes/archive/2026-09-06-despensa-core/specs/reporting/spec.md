# Delta for reporting

## ADDED Requirements

### Requirement: Out-of-stock report

The system MUST provide an on-screen report "Faltantes" listing products whose current quantity is less than or equal to their minimum quantity (current <= min). Products without inventory thresholds set SHOULD be excluded. The report MUST be ordered by severity (largest shortfall first). Export MUST NOT be included (deferred out of scope).

#### Scenario: Product at or below minimum appears

- GIVEN a product has current 2 and min 2
- WHEN the user opens "Faltantes"
- THEN the product is listed with its shortfall

#### Scenario: Product above minimum excluded

- GIVEN a product has current 10 and min 2
- WHEN the user opens "Faltantes"
- THEN the product is not listed

#### Scenario: Ordered by severity

- GIVEN product A has shortfall 5 and product B has shortfall 1
- WHEN the user opens "Faltantes"
- THEN product A is listed before product B

### Requirement: Upcoming purchases report

The system MUST provide an on-screen report "Próximas compras" listing scheduled products ordered by next purchase date ascending, starting with overdue items (next date today or earlier). Unscheduled products MUST be excluded. Export MUST NOT be included (deferred out of scope).

#### Scenario: Overdue items listed first

- GIVEN a product's next purchase date is 2026-09-01 and another's is 2026-09-10
- WHEN the user opens "Próximas compras" on 2026-09-06
- THEN the overdue product is listed first, followed by the upcoming one

#### Scenario: Unscheduled product excluded

- GIVEN a product has no period set
- WHEN the user opens "Próximas compras"
- THEN the product is not listed
