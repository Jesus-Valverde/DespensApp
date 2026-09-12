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
- Top brand header: small rounded logo tile with blue gradient + wordmark "DespensApp" in blue-600.
- Bottom tab bar, 6 tabs, fixed, white with top border: "Inicio" (house), "Despensa" (cube), "Productos" (grid), "Carritos" (cart), "Listas" (list), "Proveedores" (sliders). Active tab: blue pill behind icon + bold blue label; inactive slate-500.
- Tab-root screens: big title + small gray subtitle + a green count pill. NO back button.
- Form and detail screens: title bar WITH a circular back-arrow button at top-left that returns to the previous screen. Big title, no tabs of their own.
- FAB: round gradient (blue→indigo) "+" button, bottom-right above the tab bar, ONLY on Despensa and Productos list (opens new-product form). The Carritos list has its own identical "+" FAB that opens a create-cart modal. No FAB on forms or detail screens.
- Modals: centered white card rounded-3xl on a dimmed blurred overlay; leading icon chip (rounded, blue-50 bg, blue-600 icon), bold title + small subtitle; circular X close button top-right; footer row with an outline "Cancelar" button and one filled primary button (red if destructive).

HARD RULES: Use ONLY the fields, buttons, tabs, and texts listed in this prompt. Do NOT invent extra fields, settings, filters, or actions. ALL visible text in Spanish, exactly as written.
```

---

## Data models (reference — fields are closed sets)

Storage identifiers are English; labels below are the exact Spanish UI strings. Dates `YYYY-MM-DD`, money in MXN.

### Product
| Field | Type | Req | UI label | Appears on |
|---|---|---|---|---|
| title | string | ✔ | "Nombre" | form, catalog card, detail hero |
| family | string | — | "Familia" (category, e.g. "Lácteo"; suggestions from existing families) | form (datalist), detail badge, search |
| brand | string | — | "Marca" | form, card subtitle, detail |
| model | string | — | "Modelo" (variant, e.g. "100 Entera") | form, detail row "Modelo / Variante" |
| description | string | — | "Descripción" | form (textarea), detail |
| contentSize | string | — | "Contenido" (e.g. "1 L, 500 g") | form, card subtitle |
| area | string | — | "Área" (suggestions from existing areas) | form (datalist), card subtitle, Despensa filters |
| image | blob | — | VisualPicker tab "Imagen" (downscaled ≤5MB, removable) | form, cards, detail |
| iconKey / iconTone | string | — | VisualPicker tab "Ícono" + "Color de fondo" (mutually exclusive with image) | form, cards, detail |
| customProps | {key,value}[] | ✔ | "Propiedades personalizadas" | form fieldset, detail modal |
| stock | ProductStock | ✔ | — | Stock tab |
| purchase | ProductPurchase | ✔ | — | Compra tab |

Example product: Nombre "Leche", Familia "Lácteo", Marca "Lala", Modelo "100 Entera", Contenido "1 L".

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
Tone set (closed — 11): Azul suave, Verde menta, Ámbar suave, Naranja suave, Coral pastel, Rosa suave, Lavanda, Índigo suave, Cian cielo, Lima pastel, Gris neutro.

---

## Screen blocks (paste ONE per prompt)

### 1. Inicio (tab root)

```text
Screen "Inicio". Header: title "Inicio", subtitle "Control de despensa e inventario". No back button.
Stack of report cards, each: leading tinted icon square, bold lead, small gray explanation, small header link.
Cards: "Faltantes" (link "Revisar"; empty text "Sin productos en falta." + "Tu despensa está al día. No hay productos agotados marcados para reposición inmediata."); "Stock bajo" (link "Revisar"; empty "Sin alertas de stock bajo." + "Tu inventario tiene niveles óptimos. Te avisaremos cuando un producto esté por agotarse."); "Próximas compras" (link "Programar"; empty "Sin compras programadas." + "Planifica tu siguiente visita al supermercado o genera un carrito automático desde tus listas."); "Historial de movimientos" (empty "Sin movimientos recientes" + "Aquí verás los ingresos, egresos y cambios de inventario o compras realizadas."). No FAB.
```

### 2. Despensa (tab root)

```text
Screen "Despensa". Header: title "Despensa", subtitle "Control de despensa e inventario", right side a green pill "{n} Artículos" with a pulsing emerald dot + a blue link "Catálogo". Gradient "+" FAB.
Below: horizontal filter chips of areas, first chip always "Todos"; active chip solid blue with white text.
Product rows/cards: thumbnail (image, or pantry icon on its pastel tone, or a soft tinted fallback), title, stock badge pill: "En inventario" (emerald) / "Bajo mínimo" (amber) / "Sin stock" (red) / "Sobre máximo" (amber).
Empty state (no products): centered white card with floating gradient illustration tile, title "Tu despensa está vacía", body "Sin productos todavía. Toca el botón + para agregar el primero.", soft-blue button "Añadir a Despensa". Filter with no matches: "Sin productos en el área “{area}”."
```

### 3. Productos — catalog (tab root)

```text
Screen "Productos". Header: title "Productos", subtitle "Catálogo maestro de artículos", green pill "{n} en catálogo". Gradient "+" FAB.
Search input, placeholder "Buscar en catálogo...". Product cards: thumbnail (image / pantry icon on pastel tone / tinted fallback), bold title, gray subtitle "{contenido} • {marca} • {área}", kebab menu linking to edit.
Empty catalog: dashed-border card "Sin productos todavía." + "Toca el botón + para agregar el primero al catálogo.". Search without results: "Sin resultados para “{query}”."
```

### 4. Producto — form (new/edit)

```text
Full-page form. Title bar with circular back-arrow top-left; title "Nuevo producto" (or "Editar producto").
White card with fields in this exact order (labels bold small, Spanish):
1 "Familia" — text with suggestion dropdown, placeholder "Buscar familia..."
2 "Marca" — text, placeholder "Lala, Nutri, Alpura…"
3 "Nombre" — text, required
4 "Modelo" — text, placeholder "Descripción o presentación…"
5 "Descripción" — textarea, placeholder "Descripción del producto…"
6 "Contenido" — text, placeholder "Ej. 1 L, 500 g…"
7 "Área" — text with suggestion dropdown, placeholder "Buscar área..."
Section "Propiedades personalizadas": repeatable rows of two inputs "Propiedad" and "Valor" with a "Quitar" button; add button "Agregar propiedad".
Section "Visual del producto": segmented control "Tipo de visual" with "Imagen" / "Ícono". Imagen: dashed dropzone "Toca para agregar imagen" (or "Cambiar imagen"), subtext "PNG, JPG hasta 5MB o selecciona un ícono", button "Quitar imagen". Ícono: search "Buscar ícono... leche, fruta, pan, limpieza", 5-column grid of pantry icons, then "Color de fondo" with 11 round pastel swatches. Choosing one clears the other.
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
Modal "Editar niveles de stock": icon chip, subtitle "Configura alertas y límites para {title}". Stepper "Stock Mínimo" (badge "Alerta reposición", hint "Notificar cuando queden pocas existencias", chip "Alerta ≤ {n} uds."). Stepper "Stock Máximo" (badge "Capacidad sugerida", hint "Límite ideal para evitar sobrecompra o caducidad", chip "Capacidad: {n} uds."). Switch "Recibir alertas" with subtext "Avisame cuando esté bajo mínimo". Note "Los cambios afectan el cálculo del estado de inventario en tiempo real." Footer: "Cancelar" / "Guardar niveles". The current quantity is NOT editable here.
Modal "Registrar movimiento": icon chip, subtitle "Actualiza las existencias de {title}". Segmented "Tipo de movimiento": "Entrada" (Compra/Suma), "Salida" (Consumo), "Ajuste" (Conteo físico). Big centered quantity stepper with −/+ buttons, sign prefix (+/−), suffix "ud.", label "Cantidad a ingresar" (or "Cantidad a dejar" for Ajuste). Result pill "Existencias resultantes: {n} ➔ {m} unidades" (red if negative). Input "Motivo o detalle (opcional)", placeholder "Ej. Compra semanal de despensa, consumo familiar…", quick chips "Compra súper", "Consumo diario", "Caducado/Merma". Footer "Cancelar" / "Guardar".
Modal "Historial de movimientos": subtitle "Registro de entradas, salidas y ajustes de {title}". Filter chips "Todos (n)", "Entradas", "Salidas", "Ajustes". Reverse-chronological entries with type icon, qty delta and resulting stock. Empty "Sin movimientos todavía.". Single footer button "Cerrar". Entries cannot be edited or deleted.
```

### 8. Detail — Compra tab + its modals

```text
Tab "Compra": card with rows "Precio referencia", "Último precio", "Última compra", "Próxima compra", "Frecuencia". Card "Proveedores" listing linked suppliers with badges "Principal"/"Secundario", "Frecuencia: …", links "Ver proveedor" / "Editar", button "+ Vincular nuevo proveedor", footer button "Listo". Empty: "Sin proveedores vinculados."
Modal "Vincular nuevo proveedor" (or "Editar proveedor"): subtitle "Asocia una tienda o comercio a {title}". Fields: 1 select "Seleccionar proveedor", first option "Elegir proveedor registrado…"; 2 number input "Precio referencia", placeholder "0.00"; 3 two radio cards "Tipo de relación / Rol": "principal" / "secundario"; 4 select "Frecuencia estimada": "Sin frecuencia", "Semanal", "Quincenal", "Mensual"; 5 url input "Enlace web / URL producto (opcional)", placeholder "https://tienda.com/producto…"; 6 input "Notas o presentación (opcional)", placeholder "Ej. Paquete con 12 piezas, comprar sólo en oferta". Footer "Cancelar" / "Vincular proveedor".
Modal "Agregar a carrito": product chip (visual, family badge, brand · last price, title). Stepper "Cantidad a agregar" (−/+). Section "Carritos activos": radio list rows with meta "Proveedor: {name} · {n} arts. · Est. {money}", newest preselected; empty "No tienes carritos activos. Crea uno abajo.". Dashed button "Crear nuevo carrito". Footer "Cancelar" / filled blue "Agregar al carrito".
```

### 9. Carritos (tab root)

```text
Screen "Carritos". Header: title "Carritos", subtitle "Gestión de compras y pedidos", green pill "{n} Activos". This screen has its own gradient "+" FAB opening the create-cart modal.
Active cart cards: cart icon, bold name, summary "{n} artículos · Total {money}", blue status badge "Activo".
History section with cards for purchased/cancelled carts, badges "Comprado" / "Cancelado".
Empty: centered card "No tienes carritos activos", body "Sin carritos activos. Crea uno con el botón + o genera uno desde tus compras programadas.", blue button "Crear carrito" + text link "Generar desde compras programadas".
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

### 12. Listas (tab root)

```text
Screen "Listas". Big title "Listas". Colorful list cards: leading icon tile tinted with the list color (icon keys: Carrito de compras, Bolsa de mandado, Caja de despensa, Parrillada y eventos, Cafetería y oficina), bold list name, subtitle "1 producto" / "{n} productos".
Inline create form at top: input "Nombre de la lista", placeholder "Para el viaje", button "Crear lista". Empty: "Aún no tienes listas."
```

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

### 15. Proveedores (tab root)

```text
Screen "Proveedores". Big title "Proveedores".
Inline create/edit form card: "Nombre" (required), "Tipo" (placeholder "Supermercado, mayoreo, en línea…"), "Ubicaciones (separadas por comas)" (placeholder "Centro, Norte"). Buttons "Guardar" + "Cancelar" (only while editing).
Supplier list: card per supplier with name, type chip, location rows, actions "Editar" / "Eliminar". Delete confirmation must mention affected products.
```

---

## Current design status

| Screen / surface | State |
|---|---|
| Shell (brand header, 6 tabs, FAB) | ✅ Stitched |
| Inicio | ✅ Stitched |
| Despensa | ✅ Stitched |
| Productos catalog | ✅ Stitched |
| Product form + VisualPicker | ✅ Stitched |
| Product detail + tabs + all modals (props, delete, levels, movement, history, suppliers, vincular, lists, add-to-cart) | ✅ Stitched |
| Carritos list (status badge, empty state, own FAB) | ✅ Stitched |
| Carrito detail | ⬜ legacy — next restyle target |
| Cart create modal | ✅ Stitched (in-screen) |
| Listas / List detail / Create list modal | ⬜ legacy — next restyle targets |
| Proveedores screen | ⬜ legacy — next restyle target |
| Back-arrow title bars on forms/details | 🆕 NEW RULE from this guide — implement when adapting each screen |
