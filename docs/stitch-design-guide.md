# DespensApp — Stitch Design Guide

Context, rules, and copy-paste blocks for generating UI in **Google Stitch** that match the real
DespensApp data models — so it never invents fields, tabs, or actions.

**How to use with Stitch**

1. Paste the **GLOBAL CONTEXT** block first, then **exactly ONE screen block**, in the same prompt.
2. Work **screen by screen**. Long prompts (5k+ characters) make Stitch omit components — if a
   block feels heavy, split it (screen first, modals in follow-up prompts).
3. Iterate with short prompts: 1–2 changes per prompt, name elements precisely ("the primary
   button on the movement modal").
4. Save a screenshot after every good screen; apply consistent changes across screens with
   multi-select.
5. All visible text MUST be the exact Spanish strings in this guide. Adapted HTML gets ported to
   the repo afterwards by the developer (fidelity is a hard requirement).

---

## GLOBAL CONTEXT (paste first, every prompt)

```text
Mobile app "DespensApp" — a Spanish-language household pantry and inventory manager. 430px phone frame on a slate-100 (#F1F5F9) page background; the app surface is slate-50 (#F8FAFC). Cards are white, rounded-2xl, thin slate-200 border, soft shadow. Primary color blue-600 (#2563EB); accent gradient from blue-600 to indigo-600; destructive red-600; stock-OK emerald; warnings amber. Headings: very bold, tight tracking, slate-900. Muted text slate-500/400. Pills and badges fully rounded. Inputs rounded-lg/xl with slate-200 borders.

Chrome, every screen:
- Top brand header, IDENTICAL on every screen: small rounded logo tile with blue gradient + bold wordmark "DespensApp" (dark, near-black) with small gray tagline "Control de despensa" under it, and on the right TWO circular icon buttons (36px, slate-100 background, no border) side by side: the notification button (bell icon with a small blue dot indicator at its top-right when there are notifications — products under their minimum stock with alerts enabled — tapping opens the notifications panel) and to its right the DATA MENU button (Lucide ellipsis-vertical). The menu button opens a small dropdown anchored under it (white rounded-2xl card, shadow, 2 menu items with small icons): "Respaldo de datos" (Lucide database-backup, blue) opens the backup modal, and "Datos del catálogo" (Lucide database, green) opens the catalog-data modal (screen block 19). The header NEVER changes between screens — no back button, no screen title inside it.
- Below the header, each screen renders its own window title bar separated by a thin divider: on tab-root screens the big title + small gray subtitle + a green count pill, NO back button; on form and detail screens a circular back-arrow button at top-left next to the window title (e.g. ← "Nuevo producto") that returns to the previous screen.
- Bottom tab bar, 3 tabs, fixed, white with top border: "Inicio" (Lucide layout-grid), "Despensa" (Lucide warehouse), "Compras" (Lucide shopping-cart). Active tab: blue pill behind icon + bold blue label; inactive slate-500. Despensa hosts the catalog via a "Stock | Catálogo" toggle; Compras hosts Carritos, Listas and Proveedores via a three-way toggle. There are NO Productos, Carritos, Listas, or Proveedores tabs.
- Module switch (view selector inside Despensa and Compras): full-width segmented control right under the window title. Container: rounded-xl, slate-100 background, p-1. Segments: equal width; the ACTIVE segment is a white rounded-lg pill with small shadow and bold blue-700 text; inactive segments medium slate-500. There are no tab-panel semantics — segments are links.
  - Despensa switch: "Stock" | "Catálogo" (this is the "Catálogo de productos" access).
  - Compras switch: "Carritos" | "Listas" | "Proveedores" (Listas = shopping lists).
  - Behavior: the module remembers the last visited view (localStorage); on first visit it opens the default: Stock for Despensa, Carritos for Compras.
- FAB: round gradient (blue→indigo) "+" button, bottom-right above the tab bar, ONLY on the Despensa screen's Catálogo view (opens new-product form). The Compras screen's Carritos view has its own identical "+" FAB that opens a create-cart modal. No FAB on the Stock, Listas or Proveedores views, forms, or detail screens.
- Modals: centered white card rounded-3xl on a dimmed blurred overlay; leading icon chip (rounded, blue-50 bg, blue-600 icon), bold title + small subtitle; circular X close button top-right; footer row with an outline "Cancelar" button and one filled primary button (red if destructive).

- Icons: Lucide (lucide.dev), stroke style, 24px grid, stroke-width 1.5 for UI icons and tab bar glyphs; the 25 pantry category icons are custom app glyphs (keep them as drawn). Never use emoji or other icon families.

HARD RULES: Use ONLY the fields, buttons, tabs, and texts listed in this prompt. Do NOT invent extra fields, settings, filters, or actions. ALL visible text in Spanish, exactly as written.
```

---

## Module map (navigation structure)

```text
DespensApp — modules
├─ Inicio                      (dashboard — icon: Lucide layout-grid)
├─ Despensa                    (module switch: Stock | Catálogo — icon: Lucide warehouse)
│   ├─ Stock                   (default — pantry with area filters + stock badges)
│   └─ Catálogo                (the product catalog: search + cards)
└─ Compras                     (module switch: Carritos | Listas | Proveedores — icon: Lucide shopping-cart)
    ├─ Carritos                (default — active carts + history, own FAB)
    ├─ Listas                  (shopping lists)
    └─ Proveedores             (supplier catalog)
```

3 bottom tabs only. Switches live INSIDE Despensa and Compras (see "Module switch" in GLOBAL CONTEXT).

---

## Data models (reference — fields are closed sets)

Storage identifiers are English; labels below are the exact Spanish UI strings. Dates `YYYY-MM-DD`, money in MXN.

### Product
| Field | Type | Req | UI label | Appears on |
|---|---|---|---|---|
| title | string | ✔ | "Nombre" | form, catalog card, detail hero |
| family | string | — | "Familia" (category, e.g. "Lácteo"; suggestions from existing families) | form (combobox), detail badge, search |
| brand | string | — | "Marca" (suggestions from existing brands) | form (combobox), card subtitle, detail |
| model | string | — | "Modelo" (variant, e.g. "100 Entera") | form, card subtitle, detail row "Modelo / Variante" |
| description | string | — | "Descripción" | form (textarea), detail |
| content | string | — | "Contenido" (pack value, e.g. "500") | form, card subtitle, detail (displayed joined with unit: "500 ml") |
| unit | string | — | "Unidad" (select; canonical symbols: L, ml, g, kg, pza, paq) | form, card subtitle, detail |
| area | string | — | "Área" (PANTRY CATEGORY e.g. "Bebidas", NOT the physical spot; suggestions from existing areas) | form (combobox), Despensa filters |
| image | blob | — | VisualPicker tab "Imagen" (downscaled ≤5MB, removable, tap OR drag & drop) | form, cards, detail |
| iconKey / iconTone | string | — | VisualPicker tab "Ícono" + "Color de fondo" (mutually exclusive with image) | form, cards, detail |
| customProps | {key,value}[] | ✔ | "Propiedades personalizadas" | form fieldset, detail modal |
| stock | ProductStock | ✔ | — | Stock tab |
| purchase | ProductPurchase | ✔ | — | Compra tab |

Product name templates (`productDefs` table, joined by title, no FK): one row per known product
name holding the custom props suggested when that name is picked in the form. Picking an
existing name in the form loads its template props automatically; every product save/import
upserts its name (template props only refresh when the product ships props).

Example product: Nombre "Leche", Familia "Lácteo", Marca "Lala", Modelo "100 Entera", Contenido "1" + Unidad "L" (displayed "1 L").

### ProductStock (Stock tab)
| Field | UI label | Notes |
|---|---|---|
| current | "Existencias actuales" | read-only display; changed ONLY via movements |
| min | "Stock Mínimo" (badge "Alerta reposición") | stepper, nullable |
| max | "Stock Máximo" (badge "Capacidad sugerida") | stepper, nullable |
| alerts | "Recibir alertas" | switch, subtext "Avisame cuando esté bajo mínimo" |
| location | — | descriptive only, no edit UI |

Status badges: "En inventario" (emerald), "Bajo mínimo" (amber), "Sin stock" (red), "Sobre máximo" (amber).

### ProductPurchase (Compra tab) + SupplierLink
| Field | UI label |
|---|---|
| primarySupplierId | badge "Principal" |
| secondarySupplierIds | badge "Secundario" |
| originalPrice | "Precio referencia" |
| lastPrice | "Último precio" (set only by real purchases) |
| lastPurchaseDate / nextPurchaseDate | "Última compra" / "Próxima compra" |
| period | "Frecuencia": Semanal / Quincenal / Mensual / Sin frecuencia |
| supplierLinks[] | per supplier: "Precio referencia", "Frecuencia estimada", "Enlace web / URL producto (opcional)", "Notas o presentación (opcional)" |
| links | legacy web links |

### Supplier
| Field | Req | UI label |
|---|---|---|
| name | ✔ | "Nombre" |
| type | — | "Tipo" (placeholder "Supermercado, mayoreo, en línea…") |
| locations | ✔ | "Ubicaciones (separadas por comas)" (placeholder "Centro, Norte") |

### List
| Field | Req | UI label |
|---|---|---|
| title | ✔ | "Nombre de la lista *" |
| icon | — | "Selecciona un ícono": Carrito de compras, Bolsa de mandado, Caja de despensa, Parrillada y eventos, Cafetería y oficina |
| color | — | "Color de la lista": Azul Despensa, Verde esmeralda, Ámbar cálido, Púrpura vibrante, Rosa coral, Índigo noche, Cian fresco, Naranja mandarina, Verde lima, Fucsia magenta, Gris pizarra + custom color picker (badge "Personalizado") |
| productIds | ✔ | products added from detail |

### Cart + CartItem
| Field | Req | UI label |
|---|---|---|
| name | ✔ | "Nombre" / "Nombre del carrito *" |
| status | ✔ | Activo / Comprado / Cancelado (history retained) |
| origin | ✔ | manual or "generado automáticamente" |
| budget | — | "Presupuesto (opc.)" with $ prefix and MXN suffix |
| estimatedDate | — | "Fecha estimada" (date input) |
| items[] | ✔ | productId, title, qty, unitPrice, supplierId, supplierName — grouped by supplier |

### Movement
Types only: "Entrada" (hint "Compra/Suma"), "Salida" (hint "Consumo"), "Ajuste" (hint "Conteo físico").
Fields: date (now, not editable), type, qty, computed delta and resulting stock, "Motivo o detalle (opcional)" with quick chips "Compra súper", "Consumo diario", "Caducado/Merma".

### Product icon set (closed — 25 keys)
Lácteos, Frutas, Verduras, Pan, Café, Carne, Pescado, Limpieza, Higiene, Snacks, Bebidas, Huevos, Pastas, Granos, Aceites, Enlatados, Especias, Dulces, Congelados, Cereales, Mascotas, Bebé, Farmacia, Almacén, Otros.
Tone set (closed — 18): Azul suave, Verde menta, Ámbar suave, Naranja suave, Coral pastel, Rosa suave, Lavanda, Índigo suave, Cian cielo, Lima pastel, Gris neutro, Amarillo, Fucsia, Turquesa, Morado, Verde, Rojo suave, Cielo.

---

## Screen blocks (paste ONE per prompt)

### 1. Inicio (tab root)

```text
Screen "Inicio". Header: title "Inicio", subtitle "Control de despensa e inventario". No back button.
KPI card "Stock de tus productos" (full width): stacked horizontal bar with 3 rounded segments proportional to product counts — En inventario (emerald), Stock bajo (amber), Sin stock (red) — then 3 breakdown rows, each: colored dot + label + count + share %.
COMPRAS CARD (full width, merged 2026-09-16): one card with the 2 KPIs side by side, each icon tile + big value + small gray label — "Próxima reposición" (date of the nearest active cart's estimatedDate, blue, calendar-days) | thin vertical divider | "Compra estimada" (money, Σ qty×unitPrice, green, shopping-cart); below a thin divider and a centered faint note with a small timer icon: "Próximamente: card de compras".
Below: "Historial de movimientos" card (header inside the card) — a LIST WITH ONE CARD PER MOVEMENT: each mini-card has a colored icon tile by type (Entrada = package-plus emerald, Salida = package-minus red, Ajuste = sliders-horizontal amber), product name bold, and below it a COLORED TYPE TAG (small pill, same type colors: Entrada emerald / Salida red / Ajuste amber) next to a gray timestamp "Hoy, 10:24" (relative day Hoy/Ayer, otherwise short date; 24h time); on the right the delta in the type color (+6 / -1 / -3) over a faint "→ result". No FAB.
```

### 2. Despensa (tab root, two internal views)

```text
Screen "Despensa" with an internal segmented toggle right under the title: two tabs "Stock" and "Catálogo" (remembered selection). Header: title "Despensa", subtitle "Control de despensa e inventario", right side a green pill "{n} Artículos" with a pulsing emerald dot.
STOCK VIEW (below toggle): FIRST the area filter chips labeled "Área" (first chip "Todos"; active chip solid blue with white text), THEN a SECOND chip row labeled "Stock" filtering by stock status: "Todos", "Stock bajo", "Stock normal", "Sin stock" — the SELECTED chip wears its status color ("Stock bajo" amber, "Stock normal" emerald, "Sin stock" red, "Todos" blue), unselected chips stay outline. THEN the search bar ("Buscar en catálogo...") BELOW the filter rows. Product rows: thumbnail (image, or pantry icon on its pastel tone, or a soft tinted fallback), then a small gray ID pill (`#{id}`, rounded gray chip, dark bold mono text) + title, stock badge pill ("En inventario" emerald / "Bajo mínimo" amber / "Sin stock" red / "Sobre máximo" amber) with the current quantity under it as small text "x{n}". No FAB on this view.
CATÁLOGO VIEW (below toggle): area chips (same as Stock view) then search bar. Product cards: same thumbnail, bold title line = ID pill (`#{id}`, same gray chip as Stock) + {título}, gray subtitle "{modelo} - {contenido} {unidad} - {marca}" (empty parts omitted); right side an EYE button linking to the product DETAIL (edit lives inside detail). This view HAS the gradient "+" FAB (new product).
PRODUCT ICON CONTINUITY: each product keeps the SAME icon and pastel tone across all windows (Stock, Catálogo, detail, carts). Never vary colors per view.
CATÁLOGO ENTRY (removed 2026-09-16): the catalog no longer shows CSV import/tutorial links — both live in the header data menu → "Datos del catálogo" (screen block 19).
Empty state (Stock, no products): centered white card with floating gradient illustration tile, title "Tu despensa está vacía", body "Sin productos todavía. Toca el botón + para agregar el primero.", soft-blue button "Añadir a Despensa". Filter with no matches: "Sin productos en el área “{area}”.". Catálogo without results: "Sin resultados para “{query}”."
```

### 3. Catálogo — merged into Despensa

Removed as a standalone screen (2026-09-12): the catalog is the "Catálogo" view of Despensa — see screen block 2. Product form/detail blocks below still apply unchanged.

### 4. Producto — form (new/edit)

```text
Full-page form. Title bar: circular back-arrow top-left next to the title "Nuevo producto" (or "Editar producto").
White card. EDIT shows a mono chip "Id: #{id}" at the top. Fields in this exact order (labels bold small, Spanish; each label has a small "?" help marker with a fill-in tip) — identity first, classification last:
1 "Nombre del producto" — styled combobox (custom dropdown, NOT native datalist) listing known product names; picking an existing one loads its template props; required (placeholder "Leche" — the generic name; marca/modelo distinguish the variant)
2 "Modelo" — text, placeholder "Descripción o presentación…"
3 "Marca" (combobox with existing brands, free text allowed, placeholder "Lala, Nutri, Alpura…") + "Contenido" (text, placeholder "Ej. 500") + "Unidad" (select showing "symbol - name": "L - Litros", "ml - Mililitros", "g - Gramos", "kg - Kilogramos", "pza - Piezas", "paq - Paquete") — one row: marca left half, contenido + unidad right half; quantity and unit are SEPARATE fields
4 "Familia" — combobox, placeholder "Buscar familia..."
5 "Área" — combobox, placeholder "Buscar área..." (help clarifies: pantry category like "Bebidas", NOT the physical spot)
6 "Descripción" — textarea, placeholder "Descripción del producto…"
Section "Propiedades personalizadas": repeatable rows of two inputs "Propiedad" and "Valor" with a "Quitar" button; add button "Agregar propiedad". Choosing an existing Nombre loads its saved props here automatically.
Section "Visual del producto": segmented control "Tipo de visual" with "Imagen" / "Ícono". Imagen: dashed dropzone "Toca o arrastra para agregar imagen" (or "Cambiar imagen"), subtext "PNG, JPG hasta 5MB o selecciona un ícono", button "Quitar imagen" — tap AND drag & drop both accepted. Ícono: search "Buscar ícono... leche, fruta, pan, limpieza", 5-column grid showing the FULL 25-category icon set (5 rows, selected cell gets blue ring), then "Color de fondo" with 18 round swatches in 2 rows of 9, shown in their VIVID representative colors (not pastel). Choosing one clears the other.
Footer buttons: filled blue "Guardar" + outline "Cancelar". Validation text: "El nombre del producto es obligatorio".
```

### 5. Producto — detail (hero + tabs)

```text
Detail screen. Title bar with circular back-arrow top-left.
Hero card rounded-3xl: large visual (image or icon on pastel tone), family badge chip, very bold product title, subtitle "Marca: {marca} · ID: #{id}". Action buttons: "Editar" (blue), "Crear copia" (outline), "Eliminar" (red).
Section switcher labeled "Secciones" with hint "Toca para alternar": three large tabs — "Datos" (sub "Ficha"), "Stock" (sub "{n} disp."), "Compra" (sub "Precios").
```

### 6. Detail — Datos tab + props modal

```text
Tab "Datos": white card of key-value rows — "Código / ID", "Familia", "Modelo / Variante", "Descripción", "Área asignada", "Contenido", "Marca"; each with small gray label and bold value. Card "Propiedades personalizadas" listing {key}: {value} rows with button "Editar propiedades". Empty: "Sin datos adicionales."
Modal "Editar propiedades": centered card, blue icon chip, title "Editar propiedades", subtitle "Personaliza campos adicionales para {title}". Rows: input "Nombre de la propiedad" + red delete icon, input "Valor". Button "Agregar propiedad". Footer: outline "Cancelar" + filled blue "Guardar cambios".
```

### 7. Detail — Stock tab + its modals

```text
Tab "Stock": stock card with big current number + "Existencias actuales" and "unidades", status badge ("En inventario"/"Bajo mínimo"/"Sin stock"/"Sobre máximo"), rows "Mínimo:" and "Máximo:", pill "Recordatorio activo"/"Sin recordatorio", outline button "Editar niveles" and filled pill "Registrar movimiento". Card "Últimos movimientos" (empty "Sin movimientos todavía.").
Modal "Editar niveles de stock": icon chip, subtitle "Configura alertas y límites para {title}". Stepper "Stock bajo" (badge "Alerta reposición", hint "Notificar cuando queden pocas existencias", chip "Alerta ≤ {n} uds."). Stepper "Stock Máximo" (badge "Capacidad sugerida", hint "Límite ideal para evitar sobrecompra o caducidad", chip "Capacidad: {n} uds."). Switch "Recibir alertas" with subtext "Avisame cuando esté bajo mínimo". Note "Los cambios afectan el cálculo del estado de inventario en tiempo real." Footer: "Cancelar" / "Guardar niveles". The current quantity is NOT editable here.
Modal "Registrar movimiento": icon chip, subtitle "Actualiza las existencias de {title}". Segmented "Tipo de movimiento": "Entrada" (Compra/Suma), "Salida" (Consumo), "Ajuste" (Conteo físico). Big centered quantity stepper with −/+ buttons, sign prefix (+/−), suffix "ud.", label "Cantidad a ingresar" (or "Cantidad a dejar" for Ajuste). Result pill "Existencias resultantes: {n} ➔ {m} unidades" (red if negative). Input "Motivo o detalle (opcional)", placeholder "Ej. Compra semanal de despensa, consumo familiar…", quick chips "Compra súper", "Consumo diario", "Caducado/Merma". Footer "Cancelar" / "Guardar".
Modal "Historial de movimientos": subtitle "Registro de entradas, salidas y ajustes de {title}". Filter chips "Todos (n)", "Entradas", "Salidas", "Ajustes". Reverse-chronological entries with type icon, qty delta and resulting stock. Empty "Sin movimientos todavía.". Single footer button "Cerrar". Entries cannot be edited or deleted.
```

### 8. Detail — Compra tab + its modals

```text
Tab "Compra": card with rows "Precio referencia", "Último precio", "Última compra", "Próxima compra", "Frecuencia". Card "Proveedores" listing linked suppliers with badges "Principal"/"Secundario", "Frecuencia: …", links "Ver proveedor" / "Editar", button "+ Vincular nuevo proveedor", footer button "Listo". Empty: "Sin proveedores vinculados."
Modal "Vincular nuevo proveedor" (or "Editar proveedor"): subtitle "Asocia una tienda o comercio a {title}". Fields: 1 select "Seleccionar proveedor", first option "Elegir proveedor registrado…"; 2 number input "Precio referencia", placeholder "0.00"; 3 two radio cards "Tipo de relación / Rol": "principal" / "secundario"; 4 select "Frecuencia estimada": "Sin frecuencia", "Semanal", "Quincenal", "Mensual"; 5 url input "Enlace web / URL producto (opcional)", placeholder "https://tienda.com/producto…"; 6 input "Notas o presentación (opcional)", placeholder "Ej. Paquete con 12 piezas, comprar sólo en oferta". Footer "Cancelar" / "Vincular proveedor".
Modal "Agregar a carrito": product chip (visual, family badge, brand · last price, title). Stepper "Cantidad a agregar" (−/+). Section "Carritos activos": radio list rows with meta "Proveedor: {name} · {n} arts. · Est. {money}", newest preselected; empty "No tienes carritos activos. Crea uno abajo.". Dashed button "Crear nuevo carrito". Footer "Cancelar" / filled blue "Agregar al carrito".
```

### 9. Compras (tab root, three internal views)

```text
Screen "Compras" with an internal segmented toggle right under the title: three tabs "Carritos", "Listas", "Proveedores" (remembered selection, defaults to Carritos). No global back button.
CARRITOS VIEW: header row title "Carritos", subtitle "Gestión de compras y pedidos", green pill "{n} Activos". This view has its own gradient "+" FAB opening the create-cart modal (screen block 11). Active cart cards: cart icon, bold name, summary "{n} artículos · Total {money}", blue status badge "Activo". History section with cards for purchased/cancelled carts, badges "Comprado" / "Cancelado". Empty: centered card "No tienes carritos activos", body "Sin carritos activos. Crea uno con el botón + o genera uno desde tus compras programadas.", blue button "Crear carrito" + text link "Generar desde compras programadas".
LISTAS VIEW: header row title "Listas". Colorful list cards: leading icon tile tinted with the list color (icon keys: Carrito de compras, Bolsa de mandado, Caja de despensa, Parrillada y eventos, Cafetería y oficina), bold list name, subtitle "1 producto" / "{n} productos". Inline create form at top: input "Nombre de la lista", placeholder "Para el viaje", button "Crear lista". Empty: "Aún no tienes listas."
PROVEEDORES VIEW: header row title "Proveedores". Inline create/edit form card: "Nombre" (required), "Tipo" (placeholder "Supermercado, mayoreo, en línea…"), "Ubicaciones (separadas por comas)" (placeholder "Centro, Norte"). Buttons "Guardar" + "Cancelar" (only while editing). Supplier list: card per supplier with name, type chip, location rows, actions "Editar" / "Eliminar". Delete confirmation must mention affected products.
```

### 10. Carrito — detail

```text
Cart detail. Title bar with circular back-arrow; title {cart name}, subtitle status "Activo"/"Comprado"/"Cancelado" (+ " · generado automáticamente" if auto).
Items grouped by supplier with supplier group headers. Each item row: product thumbnail, title, editable quantity stepper and unit price (MXN), line total, "Quitar".
Add block: select "Producto" (first option "Elige un producto") + numeric "Cantidad" (placeholder "Auto") + button "Agregar".
Footer: total "Total: {money}", buttons "Pagar carrito" (blue) and "Cancelar carrito" (red outline). Empty items: "Sin productos en este carrito."
```

### 11. Modal — crear carrito

```text
Modal "Crear nuevo carrito", subtitle "Configura un nuevo carrito de compra para surtir tu despensa", cart icon chip.
Fields: 1 "Nombre del carrito *" text, placeholder "Ej. Súper Quincenal Walmart, Reposición…"; 2 "Presupuesto (opc.)" number with $ prefix and MXN suffix, placeholder "0.00"; 3 "Fecha estimada" date input.
Footer: outline "Cancelar" + filled blue "Crear carrito" with cart icon.
```

### 12. Listas — merged into Compras

Removed as a standalone screen (2026-09-12): Listas is a view of the Compras module — see screen block 9. List detail (block 13) and create-list modal (block 14) still apply unchanged.

### 13. Lista — detail

```text
List detail. Title bar with circular back-arrow; title {list title} with its color accent, subtitle "1 producto"/"{n} productos".
Product rows: thumbnail, title, "Quitar". Add block: select "Producto" (first option "Elige un producto") + button "Agregar". Empty: "Sin productos en esta lista."
Danger zone: red button "Eliminar lista".
```

### 14. Modal — crear lista

```text
Modal "Crear nueva lista", subtitle "Organiza tus compras por ocasión, tienda o periodicidad".
Fields: 1 "Nombre de la lista *" text, placeholder "Ej. Despensa Mensual, Frutas y Verduras…"; 2 "Selecciona un ícono": 5 icon buttons (Carrito de compras, Bolsa de mandado, Caja de despensa, Parrillada y eventos, Cafetería y oficina) tinted by the chosen color; 3 "Color de la lista": grid of 11 named round swatches (Azul Despensa, Verde esmeralda, Ámbar cálido, Púrpura vibrante, Rosa coral, Índigo noche, Cian fresco, Naranja mandarina, Verde lima, Fucsia magenta, Gris pizarra) + dashed "+" swatch for custom color (badge shows the active name or "Personalizado"), helper "El color destacará los productos y accesos directos de esta lista".
Footer: "Cancelar" / "Crear lista".
```

### 15. Proveedores — merged into Compras

Removed as a standalone screen (2026-09-12): Proveedores is a view of the Compras module — see screen block 9.

### 16. Notifications panel (from header bell)

```text
Modal "Notificaciones", subtitle "Productos bajo su stock mínimo", bell icon chip.
List rows: product thumbnail, bold title, amber badge "Bajo mínimo", meta "Mín: {n} · Actual: {m}", each row links to the product detail. Empty: "Sin notificaciones." + "Todos tus productos están por encima de su stock mínimo." Single footer button "Cerrar".
```

### 17. Modal — tutorial CSV — REMOVED (absorbed into block 19)

Removed 2026-09-16: the tutorial is no longer a standalone modal. Its content (template download link, fill rules, valid units) renders INLINE inside the "Datos del catálogo" modal — see screen block 19.

### 18. Modal — respaldo de datos (from header data menu)

```text
Modal "Respaldo de datos", cloud-download icon chip, subtitle shows "Último respaldo: {fecha}" or "Nunca has respaldado tus datos". Body explains Exportar (downloads everything) / Restaurar (replaces current data). Footer buttons: outline "Restaurar" + filled blue "Exportar". 🆕 2026-09-16: clicking "Restaurar" does NOT open the raw file picker — it reveals a DRAG & DROP ZONE (dashed rounded border, upload cloud icon, "Arrastra tu respaldo aquí / o haz clic para seleccionarlo — archivo .json") plus an amber warning "Restaurar reemplaza todos tus datos actuales…". The footer's outline button becomes "Cancelar" while the zone is open. Dropping or selecting the .json restores immediately (inline status messages: "Restaurando respaldo…", "Datos restaurados correctamente.", or the validation error). Entry point (2026-09-16): header data menu (ellipsis button next to the bell) → "Respaldo de datos"; the old discreet link at the bottom of Inicio was removed.
```

### 19. Modal — datos del catálogo (from header data menu)

```text
Modal "Datos del catálogo", database icon chip (blue), bold title + gray subtitle "Llena la plantilla y súbela a Despensa", circular X close. 🆕 2026-09-16 (user-picked layout, same as the old tutorial modal): body = 3 numbered steps (blue circle number + bold title + gray body) — 1 "Descarga la plantilla" (button "plantilla-catalogo.xlsx" — the template is GENERATED as .xlsx on demand), 2 "Llena una fila por producto" (Nombre obligatorio; Contenido numérico; Unidad de la lista; stock/precio/frecuencia opcionales), 3 "Sube el archivo" (guarda como XLSX o CSV; pulsa Importar catálogo; per-row errors before confirming) — then section "Unidades válidas": rows with blue symbol + "—" + name: L — Litros, ml — Mililitros, g — Gramos, kg — Kilogramos, pza — Piezas, paq — Paquete. Footer under a thin divider (equal-width buttons): outline "Exportar catálogo" (🆕 2026-09-16, replaces "Descargar plantilla" — downloads EVERY product as a template-format .xlsx, catalogo-despensapp.xlsx, so the file round-trips with the importer; the template download lives in step 1) + filled blue "Importar catálogo". The import flow is INLINE and accepts .xlsx and .csv: clicking "Importar catálogo" (button becomes "Cancelar") unfolds a drag & drop card below ("Agrega o arrastra tu archivo / o haz clic para seleccionarlo — .xlsx o .csv"), then the preview ("N productos listos para importar", amber per-row errors, duplicates note, Cancelar + "Importar N productos"), then the result ("Se importaron N productos." + omitted) with "Listo". NO second modal.
```

---

## Current design status

| Screen / surface | State |
|---|---|
| Shell (brand header, 3 tabs: Inicio/Despensa/Compras, FAB) | ✅ Stitched — 🆕 2026-09-12: 3-tab footer — 🆕 2026-09-16: header data menu (ellipsis → Respaldo de datos / Datos del catálogo) + block 19 |
| Inicio | ✅ Stitched |
| Despensa | ✅ Stitched — 🆕 2026-09-12: now hosts Catalog via "Stock | Catálogo" toggle |
| Productos catalog | ✅ Stitched — relocated as Despensa's Catálogo view |
| Compras module | 🆕 2026-09-12: hosts Carritos + Listas + Proveedores via three-way toggle (blocks 10, 13, 14 unchanged) |
| Product form + VisualPicker | ✅ Stitched — 🆕 2026-09-14: id chip, name defs + auto props, content/unit split, comboboxes, help tips, drag & drop image |
| Product detail + tabs + all modals (props, delete, levels, movement, history, suppliers, vincular, lists, add-to-cart) | ✅ Stitched |
| Carritos (Compras view: status badge, empty state, own FAB) | ✅ Stitched |
| Carrito detail | ⬜ legacy — next restyle target |
| Cart create modal | ✅ Stitched (in-screen) |
| Listas / List detail / Create list modal | ⬜ legacy — next restyle targets |
| Proveedores screen | ⬜ legacy — next restyle target |
| Back-arrow title bars on forms/details | ✅ 2026-09-14 implemented on product form + detail (remaining screens adopt when adapted) |
| Header bell + notifications panel | 🆕 designed in guide — feature pending (in-app only, no OS push) |
