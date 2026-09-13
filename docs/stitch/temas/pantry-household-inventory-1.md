---
name: Pantry & Household Inventory UI
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
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
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#784b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#996100'
  on-tertiary-container: '#ffeedd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
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
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  chip-label:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
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
This design system embodies a modern, tactile, and utility-driven mobile experience tailored for domestic inventory management, grocery planning, and pantry tracking. 

The aesthetic sits at the intersection of **Corporate / Modern** polish and **Tactile Minimalism**. It balances clinical operational efficiency with approachable domestic warmth:
- **Clarity and Instant Legibility:** High data density simplified through clear status signaling and distinct visual grouping.
- **Physical Feel:** Interactive elements rely on capsule pills (`rounded-full`), generous tap targets (minimum 44px), soft surface delineation, and gentle micro-elevations that invite direct touch interaction.
- **Operational Calm:** The palette of cool slate, pure white, and targeted cobalt blue eliminates visual noise, allowing household members to audit stock, tick off shopping carts, and detect shortages without cognitive fatigue.

## Colors
The color architecture provides high contrast and unambiguous feedback across inventory states:

### Primary Palette
- **Primary Cobalt (`#2563EB`):** Main interactive brand driver used for active filter chips, primary action buttons, key indicators, and active tab highlights.
- **Primary Dark (`#1D4ED8`):** Pressed/hover state for primary actions.
- **Primary Ice Light (`#EFF6FF`):** Subdued active states, secondary pill fills, and highlighted background surfaces.
- **Primary Soft Tint (`#DBEAFE`):** Secondary borders and focus indicators.

### Functional Status Tokens
- **Success / In-Stock:** Surface `#ECFDF5`, Content & Border `#10B981`. Designates fully stocked items, validated checkouts, and completed steps.
- **Warning / Low-Stock:** Surface `#FEF3C7`, Content & Border `#F59E0B`. Designates items running low, replenishment reminders, and scheduled batches.
- **Alert / Out-of-Stock:** Surface `#FEE2E2`, Content & Border `#EF4444`. Designates empty pantry slots, critical shortages, and destructive actions.

### Canvas & Surface Hierarchy
- **Canvas Base (`#F8FAFC`):** Global application background for depth contrast behind white modules.
- **Surface Layer (`#FFFFFF`):** Base for cards, sheet drawers, modals, and inactive filter pills.
- **Surface Subtle Border (`#E2E8F0`):** Hairline structure for dividers and card wrappers.
- **Inactive Pill Border (`#E2E8F0` / `border-slate-200`):** Defining crisp, clean boundaries for secondary controls.

### Typography & Iconography Colors
- **Content Primary (`#0F172A`):** Headlines, product titles, and high-priority figures.
- **Content Slate / Inactive Pill Label (`#334155`):** Body copy and default filter chip text.
- **Content Muted (`#64748B`):** Captions, secondary timestamps, unit measures, and counts.

## Typography
**Plus Jakarta Sans** serves as the unified typographic foundation. Its balanced geometric proportions, open apertures, and contemporary letterforms ensure high readability on small mobile viewports, even at rapid scanning speeds in supermarkets or kitchen settings.

### Application Rules
- **Display & Section Titles:** Rendered with `headline-lg` and `headline-md` at `600` or `700` weight with subtle negative letter spacing (`-0.02em` to `-0.01em`) to create anchored authority.
- **Filter Chips:** Use `chip-label` (14px, Semibold `600`) to guarantee high contrast and legibility inside both solid filled and white pill shapes.
- **Product Titles & Counts:** Inventory item names use `headline-sm` or `body-md` (Semibold), with trailing item counts styled in `caption` or `label-sm` with muted color (`#64748B`).

## Layout & Spacing
The layout follows a strict mobile-first architecture governed by dynamic vertical stacking and horizontal overflow strips for categorical switching.

### Rhythms & Structural Boundaries
- **App Outer Margin:** Fixed at `1rem` (16px) on mobile viewports, expanding to `1.5rem` (24px) on tablet viewports.
- **Horizontal Scroll Carousels:** Filter chips and category segments bleed edge-to-edge across the screen using negative outer margins, with `1rem` inline padding and a strict `gap-2.5` (10px) element gap. Scrollbars must be masked (`no-scrollbar`).
- **Vertical Rhythm:** A consistent 12px to 16px vertical gap separates product cards and inventory sections. Section groups use `space-lg` (24px) spacing.
- **Safe Areas & Fixed Bars:** Top header navigation reserves 56px height plus device status bar inset. The bottom persistent navigation dock occupies 64px height plus safe area bottom inset (`env(safe-area-inset-bottom)`), ensuring cards and floating actions are never obstructed.

## Elevation & Depth
Depth is created through clean tactile layers, combining subtle border structures with diffuse, soft light scattering.

### Elevation Levels
- **Level 0 (Flat Canvas):** `#F8FAFC` base screen. No shadow.
- **Level 1 (Cards & Inactive Pills):** White surface (`#FFFFFF`) framed with a 1px border (`#E2E8F0`) and `shadow-sm` (`0 1px 2px 0 rgba(15, 23, 42, 0.05)`). Produces clear differentiation against the base canvas.
- **Level 2 (Active Pills & Floating Actions):** Active blue filter chips and primary action buttons utilize a tinted micro-shadow: `0 4px 12px -2px rgba(37, 99, 235, 0.25)`.
- **Level 3 (Modals & Bottom Drawers):** Elevated sheet panels use `shadow-xl` (`0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)`) paired with a backdrop blur overlay (`bg-slate-900/40 backdrop-blur-sm`).
- **Level 4 (Persistent Bottom Bar):** Crisp top hair-border (`border-t border-slate-200`) coupled with `0 -4px 16px rgba(15, 23, 42, 0.03)` to gently detach the navigation bar from scrolling content.

## Shapes
The design system operates with two primary shape primitives:

1. **The Capsule (`rounded-full` / `9999px`):** Reserved for interactive controls, state filters, action buttons, progress bar tracks, and count badges. This form communicates touchability and dynamic movement.
2. **The Soft Container (`rounded-2xl` / `16px`):** Applied to product list cards, cart summaries, bottom sheets, alert callouts, and modular input groupings. It provides an approachable, organic container feel without wasting screen space.
- Smaller internal elements (like product thumbnail containers or quantitative steppers) use `rounded-xl` (12px).

## Components

### 1. Filter Chips (Pastillas de Selección) - Key Component
Directly matching the visual reference:
- **Active Filter Chip:**
  - Geometry: `h-10 px-5 rounded-full inline-flex items-center justify-center`.
  - Colors: Background `#2563EB`, text `#FFFFFF`.
  - Typography: `Plus Jakarta Sans`, 14px, Semibold (`600`).
  - Content Format: Plain text label combined with counter in parentheses, e.g., `Todos (3)`.
  - Shadow: Soft blue glow `shadow-sm shadow-blue-500/20`.
- **Inactive Filter Chip:**
  - Geometry: `h-10 px-5 rounded-full inline-flex items-center justify-center`.
  - Colors: Background `#FFFFFF`, 1px solid border `#E2E8F0` (`border-slate-200`), text `#334155` (`text-slate-700`).
  - Typography: `Plus Jakarta Sans`, 14px, Medium to Semibold (`500` - `600`).
  - Content Format: E.g., `En preparación (2)`, `Completados (5)`.
  - Interaction: Hover/Active state shifts background to `#F8FAFC` and border to `#CBD5E1`.
- **Container Strip:**
  - Flex container with `flex gap-2.5 overflow-x-auto no-scrollbar py-1 px-4`.

### 2. Product & Cart Cards
- White background (`#FFFFFF`), `rounded-2xl` (16px), 1px border (`#E2E8F0`), padding 16px.
- Internal Layout: Horizontal row with product visual thumbnail (48x48px, `rounded-xl`, background `#F1F5F9`), item name with category caption, quantity stepper controls, and optional progress bar at the card bottom (track height 4px, `rounded-full`, fill `#2563EB` or status color).

### 3. State & Status Badges
- Compact capsules (`h-6 px-2.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5`):
  - *In Stock:* Background `#ECFDF5`, text `#059669`.
  - *Low Stock:* Background `#FEF3C7`, text `#D97706`.
  - *Missing / Depleted:* Background `#FEE2E2`, text `#DC2626`.

### 4. Quantity Stepper Controls
- Capsule container with border `#E2E8F0` and background `#F8FAFC`.
- Decrement/Increment buttons (32x32px touch area) with center-aligned icons (`#64748B`), flanking a central numeric value (`#0F172A`, 14px bold).

### 5. Input Fields
- `h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none`.

### 6. Bottom Navigation Dock
- 64px fixed bar pinned to the viewport bottom.
- Background `#FFFFFF` with slight top border (`#E2E8F0`).
- 5 icon destinations. The active item renders with an active pill indicator (`bg-blue-50 text-blue-600 rounded-full px-3 py-1 flex items-center gap-1.5 font-semibold text-xs`). Inactive items remain muted `#64748B`.