---
name: Pragmatic Local Intelligence
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45474c'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#041528'
  on-tertiary: '#ffffff'
  tertiary-container: '#1a2a3e'
  on-tertiary-container: '#8191a9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-sm:
    fontFamily: Hanken Grotesk
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  sidebar-width: 240px
  filter-panel-width: 280px
---

## Brand & Style
This design system is engineered for local retail network owners who prioritize operational efficiency over aesthetic flair. The brand personality is **sober, authoritative, and analytical**. It treats data as the primary interface element, minimizing decorative flourishes to maximize information density and cognitive throughput.

The design style is **Modern Corporate / Systematic**, characterized by a rigorous adherence to grid structures, subtle tonal shifts for hierarchy, and a "function-first" philosophy. The emotional response should be one of control and clarity—moving the user from "monitoring" to "decision-making" with minimal friction. Every pixel is dedicated to surfacing trends, stock levels, and performance metrics without marketing-led distractions.

## Colors
The palette is rooted in a professional **Deep Slate (#1E293B)** for primary navigation and text, providing high contrast and a sense of stability. A **Professional Blue (#3B82F6)** is used sparingly for primary actions, selection states, and focus indicators. 

The background architecture utilizes a spectrum of **Clean Grays** (from #F8FAFC to #E2E8F0) to delineate different functional zones without heavy borders. Functional alert colors are strictly reserved for data states: **Success Green** for positive growth or "In Stock" status, **Warning Amber** for low inventory or pending approvals, and **Critical Red** for immediate stock-outs or negative performance anomalies.

## Typography
The system uses **Hanken Grotesk** for all standard UI elements, chosen for its exceptional legibility at small sizes and its modern, professional character. To support high data density, font sizes are slightly smaller than average consumer apps, relying on clear weights and structured line heights to maintain readability.

**JetBrains Mono** is introduced for tabular data, SKU numbers, and currency values. This monospaced font ensures that columns of numbers align perfectly, allowing the user to scan vertical lists for outliers or patterns with maximum precision.

## Layout & Spacing
This design system utilizes a **Fixed Grid** model with a sidebar-driven architecture. The layout is optimized for 1440px desktop displays, as this is the primary tool for retail management. 

- **Density:** We use a 4px base unit. Component padding is tight (8px-12px) to ensure as much data as possible is visible above the fold.
- **Structure:** A persistent 240px left-hand navigation sidebar provides access to network-wide modules. Complex data views utilize a secondary 280px right-hand collapsible panel for advanced filtering and facet-based search.
- **Responsive Behavior:** On tablets, the sidebars collapse into icons or drawers. On mobile, charts simplify to key aggregate figures, and data tables transition to card-based summaries.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows. This keeps the interface feeling flat and efficient.

- **Level 0 (Background):** Neutral Gray (#F8FAFC). Used for the main workspace background.
- **Level 1 (Containers):** Pure White (#FFFFFF). Used for KPI cards and data table containers. These feature a 1px border (#E2E8F0) to define edges.
- **Level 2 (Interlays):** Subtle drop shadows (4px blur, 2% opacity) are used only for active dropdowns or context menus to provide a slight visual lift without cluttering the "flat" data environment.
- **State Changes:** Hover states on rows or cards are indicated by a subtle background shift to #F1F5F9, never an elevation increase.

## Shapes
The shape language is **Soft (0.25rem)**. This provides a modern touch that prevents the UI from feeling "dated" or purely industrial, while maintaining the structured, space-efficient qualities of a grid-based system. 

Buttons, input fields, and cards all share this 4px radius. Smaller components like status "pills" or tags may use a slightly higher radius (rounded-lg) to distinguish them from actionable containers, but the overall aesthetic remains sharp and disciplined.

## Components
- **Data Tables:** The core of the ERP. Features include sticky headers, zebra-striping on hover, and condensed row heights (32px-40px). Columns containing currency or quantities must use monospaced typography and right-alignment.
- **KPI Cards:** Compact containers featuring a title, a large "JetBrains Mono" value, and a small trend sparkline or percentage change indicator.
- **Filtering Sidebars:** Vertical stacks of accordion-style filters. Use checkboxes and "select-all" functionality to allow rapid multi-store or multi-category comparisons.
- **Buttons:** Primary buttons are solid Deep Slate. Secondary buttons are outlined. Tertiary actions (like "Export" or "Print") are text-only with an icon.
- **Status Badges:** Small, low-saturation background fills with high-saturation text (e.g., light red background with dark red text) to indicate stock or order status without overwhelming the user.
- **Input Fields:** Minimalist design with 1px borders. Focus states use the Professional Blue for a clear visual affordance.