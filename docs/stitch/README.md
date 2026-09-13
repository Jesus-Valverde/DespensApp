# Stitch exports

Design mockups generated in Google Stitch, saved here as the source of truth for
fidelity passes when porting each screen to code.

## Convention

One folder per screen, named after the matching screen block in
`docs/stitch-design-guide.md`:

```
docs/stitch/<screen-key>/
├─ design.html   ← Stitch HTML export
└─ design.png    ← screenshot (optional)
```

Screen keys: `inicio`, `despensa-stock`, `despensa-catalogo`, `producto-form`,
`producto-detail`, `detalle-datos`, `detalle-stock`, `detalle-compra`,
`compras-carritos`, `carrito-detail`, `compras-listas`, `lista-detail`,
`compras-proveedores`, `notifications-panel`, plus any standalone modal
(`modal-<nombre>`).

For modal batches (several modals in one export), use one folder per batch:
`batches/2026-09-12-modals/` and keep the concatenated HTML as delivered.
