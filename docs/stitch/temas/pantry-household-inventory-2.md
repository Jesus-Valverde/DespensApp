---
name: Pantry & Household Inventory UI
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#9af2c5'
  on-secondary-container: '#0c714d'
  tertiary: '#784b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#94631b'
  on-tertiary-container: '#ffeddd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#9df4c8'
  secondary-fixed-dim: '#81d8ad'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb7'
  tertiary-fixed-dim: '#fabb6b'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  primary-hover: '#1d4ed8'
  primary-ice: '#eff6ff'
  primary-soft: '#dbeafe'
  canvas-bg: '#f8fafc'
  surface-white: '#ffffff'
  border-subtle: '#e2e8f0'
  border-muted: '#cbd5e1'
  content-primary: '#0f172a'
  content-secondary: '#1e293b'
  content-slate: '#334155'
  content-muted: '#475569'
  content-tertiary: '#64748b'
  status-success-bg: '#ecfdf5'
  status-success-text: '#10b981'
  status-warning-bg: '#fef3c7'
  status-warning-text: '#f59e0b'
  status-alert-bg: '#fee2e2'
  status-alert-text: '#ef4444'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.005em
  card-header-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.05em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system embodies a modern, tactile, and utility-driven mobile experience tailored for domestic inventory management, grocery planning, and household pantry tracking.

The aesthetic balances **Corporate / Modern** precision with **Tactile Minimalism**, offering:
- **Instant Clarity & Legibility:** High data density organized through explicit status signaling, structured card containment, uppercase subheadings with tracking, and clean visual grouping.
- **Approachable Tactility:** Core interactive controls leverage generous pill shapes (`rounded-full`), soft card frames (`rounded-2xl`), accessible tap targets (44px to 48px), crisp borders, and subtle micro-elevations.
- **Operational Calm:** A foundational palette of slate grays (`#334155`, `#475569`, `#1E293B`), pure white surfaces (`#FFFFFF`), neutral canvas tones (`#F8FAFC`), and purposeful cobalt blue accents (`#2563EB`) minimizes cognitive friction during pantry audits, supermarket runs, and stock updates.

## Colors

The color palette emphasizes contrast, clarity, and unambiguous visual cues across inventory modules.

### Key Roles
- **Primary Cobalt (`#2563eb`):** Primary action triggers, active pill indicators, section action links, and focused borders.
- **Primary Ice (`#eff6ff`):** Subtle active selection background for assigned list chips and active pill badges.
- **Primary Soft (`#dbeafe`):** Border outline for assigned active chips, focus halos, and secondary selection states.
- **Secondary (`#006c49`):** Reserved for confirmed, optimal, or fresh stock inventory states.
- **Tertiary (`#784b00`):** Reserved for moderate attention warnings and expiring-soon alerts.

### Neutral & Card Structure
- **Canvas Base (`#f8fafc`):** Application-wide background providing clear separation beneath elevated white cards.
- **Surface White (`#ffffff`):** Base fill for card containers, input rows, sheets, and active elements.
- **Subtle Borders (`#e2e8f0`):** Exterior card perimeter strokes and standard input borders.
- **Muted Dashed Borders (`#cbd5e1`):** Dashed borders on actionable unfilled buttons (such as "+ Añadir a lista").
- **Content Hierarchy:**
  - Headings & Primary Values: `#0f172a` and `#1e293b`.
  - Uppercase Card Headers & Section Titles: `#334155` and `#475569`.
  - Captions & Supporting Details: `#64748b`.

## Typography

**Plus Jakarta Sans** governs the typography scale across all touchpoints, pairing friendly geometric curves with tight tracking on functional headers.

### Specialized Hierarchies
- **Uppercase Section Labels (`card-header-caps`):** Rendered at 13px with bold weight (`fontWeight: 700`), uppercase casing, and tracked spacing (`letterSpacing: 0.05em`) in slate tones (`#334155` or `#475569`). Used across module headers like `"UBICACIÓN EN DESPENSA / REFRI"` and `"LISTAS ASIGNADAS (COMPRA)"`.
- **Action Links & Triggers:** Contextual inline text actions (such as `+ Gestionar`) utilize `label-md` with `fontWeight: 600` in Cobalt Blue (`#2563EB`).
- **Location & Data Labels:** Internal field values utilize `label-md` or `body-md` in deep slate (`#1E293B`) to ensure maximum legibility against light container backgrounds.

## Layout & Spacing

The layout is built around a mobile-first approach optimized for thumb-reach ergonomics and visual modularity.

### Layout Rules
- **Canvas Margins:** Outer edge padding is `1rem` (16px) on mobile viewports and scales to `1.5rem` (24px) on tablet/desktop displays.
- **Card Padding:** Standard section cards feature internal padding of `1.25rem` (20px) or `1rem` (16px), maintaining a vertical separation gap of `0.75rem` (12px) between the title header and child chips/inputs.
- **Component Stacking:** Vertical stacks between individual cards or form groups use a rhythm of `0.75rem` (12px) to `1rem` (16px).
- **Inline Grouping:** Sibling action chips maintain an explicit horizontal gap of `0.625rem` (10px) to prevent accidental mis-taps.

## Elevation & Depth

Visual hierarchy uses tactile card layering, crisp perimeter outlines, and soft ambient drop shadows rather than heavy skeuomorphism.

- **Level 0 (Canvas):** Flat background in `#F8FAFC`.
- **Level 1 (Structural Cards & Inputs):** Base cards and internal input fields use surface `#FFFFFF` with a crisp 1px border `#E2E8F0` and micro-shadow: `0 1px 2px 0 rgba(15, 23, 42, 0.04)`.
- **Level 2 (Interactive Floating Chips & Active Pills):** Active filters and filled buttons employ a subtle brand shadow: `0 2px 8px -1px rgba(37, 99, 235, 0.20)`.
- **Level 3 (Modals & Bottom Drawers):** Overlay surfaces cast a high diffusion shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.1)` anchored above a backdrop blur.

## Shapes

The geometric identity is defined by three standardized radii levels:

1. **Card Containers (`rounded-2xl` / 16px):** Used for all outer card boundaries, including the Location Input Card and Assigned Lists Card, establishing clean, friendly frames.
2. **Interactive Pills & Badges (`rounded-full` / 9999px):** Used for location input pills, assigned list chips, dashed add buttons, filter chips, and primary action buttons.
3. **Internal Fields & Media Elements (`rounded-xl` / 12px):** Applied to image thumbnails, nested media, and standard rectangular input controls.

## Components

### 1. Campo de Ubicación (Location Input / Card Field)
A structured containment card indicating the physical placement of an item (e.g., pantry, refrigerator, freezer):
- **Container:**
  - Geometry: `rounded-2xl` (16px radius), `border border-[#E2E8F0]`, background `#FFFFFF`.
  - Padding: `16px` to `20px` (`p-4` or `p-5`).
- **Header Label:**
  - Uppercase tracked typography: `text-[13px] font-bold tracking-wider text-[#334155]` (or `#475569`).
  - Text: `"UBICACIÓN EN DESPENSA / REFRI"`.
  - Spacing: `mb-3` (12px gap below header).
- **Location Pill (Interior Field):**
  - Shape: Full pill (`rounded-full`) or soft pill (`rounded-xl`), height 44px to 48px (`h-12`).
  - Surface: Background `#FFFFFF` or `#F8FAFC`, surrounded by a subtle border (`border border-[#E2E8F0]` or `#CBD5E1`).
  - Content Layout: `inline-flex items-center w-full px-4 gap-2.5`.
  - Leading Icon: Map pin / location / tack icon (20px × 20px), stroke color `#475569` or `#334155`.
  - Text: Product location name (e.g., `"Refrigerador Cocina"`) set in `font-medium text-[14px] text-[#1E293B]`.

### 2. Tarjeta de Listas Asignadas (Assigned Lists Card / Header Action Card)
A module displaying grocery list bindings with integrated inline management:
- **Container:**
  - Geometry: `rounded-2xl` (16px radius), `border border-[#E2E8F0]`, background `#FFFFFF`.
  - Padding: `16px` to `20px` (`p-4` or `p-5`).
- **Header Row:**
  - Layout: `flex items-center justify-between mb-3`.
  - Leading Content: `flex items-center gap-2`.
    - Icon: Shopping bag / list line icon (18px × 18px) in Primary Cobalt (`#2563EB`).
    - Title: `"LISTAS ASIGNADAS (COMPRA)"` in `text-[13px] font-bold tracking-wider text-[#1E293B]`.
  - Trailing Action: Text button `"+ Gestionar"` in `text-sm font-semibold text-[#2563EB] hover:underline cursor-pointer`.
- **Chips & Action Area:**
  - Layout: `flex flex-wrap items-center gap-2.5 pt-1`.
  - **Selected / Assigned Chip:**
    - Shape: `rounded-full` (or `rounded-xl`), height 38px to 40px (`py-2 px-4`).
    - Surface & Border: Background `#EFF6FF` (`primary-ice`), border `1px solid #DBEAFE`.
    - Leading Icon: Shopping cart (16px × 16px) in `#2563EB`.
    - Text: List title (e.g., `"Súper Semanal"`) in `text-sm font-semibold text-[#2563EB]`.
  - **Dashed Add Action Chip ("+ Añadir a lista"):**
    - Shape: `rounded-full` (or `rounded-xl`), height 38px to 40px (`py-2 px-4`).
    - Surface & Border: Transparent or white base with a dashed border (`border border-dashed border-[#CBD5E1]`).
    - Text: `"+ Añadir a lista"` in `text-sm font-medium text-[#475569] hover:text-[#1E293B] hover:border-[#94A3B8] transition-colors`.

### 3. Pill Outline Action Button
- Standard pill button for secondary edits: `rounded-full`, `h-11`, `px-5`, `border-2 border-[#2563EB]`, background `#FFFFFF` transitioning to `#EFF6FF` on hover. Text and pencil icon in `#2563EB`, `font-semibold text-sm`.

### 4. Filter Chips (Pastillas de Selección)
- **Active:** `h-10 px-5 rounded-full bg-[#2563EB] text-white text-sm font-semibold shadow-sm shadow-blue-500/20`.
- **Inactive:** `h-10 px-5 rounded-full bg-white border border-[#E2E8F0] text-[#334155] text-sm font-medium hover:bg-[#F8FAFC]`.

### 5. Product Cards & Standard Inputs
- Cards: `rounded-2xl`, border `#E2E8F0`, surface `#FFFFFF`, padding 16px.
- Input Fields: `h-12 px-4 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] text-sm placeholder:text-[#64748B] focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBEAFE] outline-none`.