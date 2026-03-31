# KITEK Full Frontend Redesign — Design Specification

**Date:** 2026-03-31
**Scope:** Visual redesign of all three frontend apps (Web Admin Panel, Client Portal, Mobile App). No backend changes. No functionality changes.

---

## 1. Design Direction

**Aesthetic:** Boutique Fintech — warm, editorial, opinionated. Inspired by Wise, Mercury, HAY.

**Core Principles:**
- Color used structurally (to group, differentiate, signal hierarchy), never decoratively
- Typography creates hierarchy through font family contrast, not just weight
- Depth through inner shadows and tinted surfaces, not drop shadows
- Every screen should feel intentionally designed for a car rental context
- The collapsed sidebar's forest green strip is the signature visual element

**Anti-patterns (explicitly avoided):**
- Inter, Roboto, Arial, Space Grotesk, system-ui
- Purple gradients, evenly distributed "safe" palettes
- Symmetric 3-column icon+heading+description grids
- border-radius: 12px on everything
- Drop shadow cards as the only content pattern
- Flat solid-color alternating sections
- Fade-in-from-bottom as the only animation
- Unmodified Lucide/Heroicons as section decoration
- shadcn/ui components without customization

---

## 2. Design Foundation

### 2.1 Color Palette

| Token | Hex | OKLCH (for Tailwind 4) | Usage |
|-------|-----|------------------------|-------|
| `--cream` | `#FDFAF6` | `oklch(0.984 0.008 80)` | Main background |
| `--warm-stone` | `#F3EDE7` | `oklch(0.946 0.012 75)` | Sidebar bg, card surfaces |
| `--sage-wash` | `#F5F9F7` | `oklch(0.975 0.010 160)` | Tinted card surfaces, hover states |
| `--amber-tint` | `#FBF7F0` | `oklch(0.973 0.012 85)` | Alternating table rows |
| `--sand` | `#E8DFD5` | `oklch(0.900 0.014 70)` | Borders, dividers, separators |
| `--charcoal` | `#2C2C2C` | `oklch(0.250 0.000 0)` | Primary text, headings |
| `--warm-gray` | `#7A746D` | `oklch(0.530 0.010 65)` | Secondary text, labels |
| `--forest-green` | `#1B4332` | `oklch(0.330 0.060 160)` | Primary actions, active states, key accent |
| `--sage` | `#2D6A4F` | `oklch(0.440 0.070 160)` | Hover states, secondary green |
| `--terracotta` | `#C75D3A` | `oklch(0.560 0.150 40)` | Destructive, overdue, attention |
| `--amber-glow` | `#D4A853` | `oklch(0.740 0.120 80)` | Warnings, extended status |
| `--soft-teal` | `#5B9A8B` | `oklch(0.620 0.060 170)` | Info states, links, chart accents |

**Stat card tints (dashboard):**
- Sage tint: `#F0F7F4` (active rentals)
- Amber tint: `#FBF7F0` (today's pickups)
- Teal tint: `#F0F7F7` (today's returns)
- Terracotta tint: `#FDF5F3` (overdue — only if count > 0)

### 2.2 Typography

| Role | Font Family | Weight | Usage |
|------|------------|--------|-------|
| **Display** | Fraunces | 500, 600 | Page titles, section headings, stat numbers, prices |
| **Body/UI** | Satoshi | 400, 500, 600 | Labels, table text, buttons, nav items, form fields |
| **Data** | IBM Plex Mono | 400, 450, 500 | Prices, dates, mileage, IDs, registration plates |

**Type scale (web):**
- Page title: Fraunces 600, 28px, charcoal
- Section heading: Fraunces 500, 20px, charcoal, with 40px sand underline (left-aligned, not full-width)
- Card heading: Fraunces 500, 16px, charcoal
- Body: Satoshi 400, 14px, charcoal
- Label: Satoshi 500, 12px, warm-gray, uppercase, letter-spacing 0.05em
- Data: IBM Plex Mono 400, 14px
- Small data: IBM Plex Mono 400, 12px, warm-gray

**Type scale (mobile):**
- Screen title: Fraunces 600, 24px, charcoal
- Section heading: Fraunces 500, 18px, charcoal
- Body: Satoshi 400, 16px (native minimum), charcoal
- Label: Satoshi 500, 12px, warm-gray
- Data: IBM Plex Mono 400, 14px

**Font loading:**
- Web: Google Fonts via next/font (Fraunces, IBM Plex Mono) + self-hosted Satoshi (not on Google Fonts)
- Mobile: expo-font with bundled .ttf/.otf files, system fallback during splash only

### 2.3 Textures & Depth

- **Noise grain overlay:** CSS pseudo-element on body, opacity 0.03, blended via `background-image: url(data:image/svg+xml,...)` — adds analog warmth to cream background. Web only (not mobile).
- **Inner shadows on cards:** `inset 0 1px 3px rgba(0,0,0,0.04)` — cards feel recessed, not floating
- **Focus/active glow:** `0 0 0 3px rgba(27,67,50,0.12)` — warm green ring, not blue browser default
- **Top-edge accent on cards:** 2px solid line at top — forest green (info), terracotta (alerts), amber (warnings)
- **Sidebar collapsed texture:** CSS linen-like pattern on forest green background via repeating-linear-gradient

---

## 3. Web Admin Panel

### 3.1 Sidebar (Collapsible Shelf)

**Expanded (~240px):**
- Background: warm-stone with subtle noise
- KITEK logo: Fraunces 600, forest green, top-left
- Nav items: Satoshi 500, 14px, charcoal
- Active item: forest green background, cream text, 3px left border
- Inactive hover: sage-wash background, 150ms transition
- Bottom widget: "Quick Pulse" — active rentals count + overdue count in Plex Mono, small Satoshi labels above each
- Divider between nav and pulse: sand-colored, 1px

**Collapsed (~56px):**
- Background: forest green with linen texture overlay
- Icons: cream/white, 20px
- Active icon: rounded cream pill (24x36px) behind icon
- Transition: 250ms ease-out, content area expands to fill
- The collapsed state is the brand signature — a distinctive green vertical strip

### 3.2 Top Bar

- Background: transparent (blends with cream content)
- Right: user initials circle (forest green bg, cream Fraunces letter), username in Satoshi 400
- Left: breadcrumbs in Satoshi 400, warm gray, `/` separators in sand color
- Bottom: 1px sand divider (no shadow)

### 3.3 Tables

- No visible grid lines — alignment and whitespace create structure
- Column headers: Satoshi 500, 12px, uppercase, warm-gray, letter-spacing 0.05em
- Row height: 52px
- Alternating rows: cream / amber-tint
- Numbers and dates: IBM Plex Mono, right-aligned
- Status labels: Satoshi 600, 11px, uppercase — text color + 8% opacity background tint:
  - AKTYWNY: sage text on sage tint
  - SZKIC: warm-gray text on sand tint
  - PRZEDŁUŻONY: amber-glow text on amber tint
  - ZALEGŁY: terracotta text on terracotta tint
  - ZWRÓCONY: warm-gray text on warm-stone
- Row hover: sage-wash background, 150ms ease
- Pagination: "Pokaż więcej" link in forest green, or simple prev/next arrows — not numbered buttons

### 3.4 Cards

- Inner shadow: `inset 0 1px 3px rgba(0,0,0,0.04)` — no drop shadow
- Top edge: 2px solid accent color (context-dependent)
- Background: warm-stone or sage-wash (varies by context)
- Padding: 24px top/bottom, 20px sides (asymmetric)
- Section headings inside cards: Fraunces 500, charcoal, with 40px sand underline left-aligned
- Border: 1px sand, border-radius 6px (not 12px)

### 3.5 Buttons

- **Primary:** forest green bg, cream text, Satoshi 600, border-radius 6px, no gradient. Hover: sage bg, 150ms.
- **Secondary:** transparent bg, forest green text, 1px forest green border. Hover: sage-wash fill.
- **Destructive:** terracotta bg, cream text. Sparingly used.
- **Ghost:** forest green text, underline on hover. No border, no background.
- **All buttons:** 40px height (web), adequate padding (16px horizontal minimum)

### 3.6 Form Inputs

- Full border, 1px sand, border-radius 6px
- Focus: border transitions to forest green, focus glow ring
- Label: Satoshi 500, warm-gray, above the input
- Placeholder: Satoshi 400, sand color
- Error: terracotta border + terracotta text below

### 3.7 Dashboard Page

- Stat cards in a row: 4 cards, each with unique tint background (sage/amber/teal/terracotta-tint)
  - Number: Fraunces 600, 32px, forest green (or terracotta for overdue)
  - Label: Satoshi 400, 12px, warm-gray
  - No icons in stat cards — the number IS the visual
- Activity feed below: flat list, sand dividers, timestamps in Plex Mono warm-gray, descriptions in Satoshi

### 3.8 Detail Pages (Vehicle, Customer, Rental)

- Page title: Fraunces 600, 28px, with status label inline
- Content in card sections with 24px gap between cards
- Two-column layout for key-value pairs inside cards:
  - Label (left): Satoshi 500, warm-gray, uppercase, 12px
  - Value (right): Satoshi 400 or Plex Mono, charcoal, 14px
- Action buttons at top-right of the page, not inside cards

### 3.9 Animations & Micro-interactions

- **Sidebar collapse/expand:** 250ms ease-out, content area smoothly fills
- **Table row hover:** sage-wash bg, 150ms ease
- **Button hover:** bg color shift, 150ms ease
- **Page load:** staggered fade-in for cards — first card at 0ms, each subsequent +80ms delay. Opacity 0→1 + translateY 8px→0. Duration 300ms ease-out. Subtle, not dramatic.
- **Stat card numbers:** count-up animation on dashboard load (0 → actual value, 400ms ease-out)
- **Focus ring:** glow appears with 200ms ease
- **Toast notifications:** slide in from bottom-right with 250ms ease-out, no bounce

---

## 4. Client Portal

### 4.1 Layout

- Single-column, max-width 720px, centered on cream background (`#FDF9F3` — slightly warmer than admin)
- Header: KITEK wordmark (Fraunces, forest green) left, customer name (Satoshi 400) right, sand divider below
- Footer: "KITEK Wynajem Pojazdów" in Satoshi 400, warm-gray, centered
- No sidebar, no hamburger, no nav links

### 4.2 Rental List (Main Page)

- Horizontal cards (full-width rows), 20px gap between
- Each card:
  - Left: vehicle make/model (Fraunces 500, 16px), registration plate (Plex Mono, 13px, warm-gray) below
  - Center: date range (Satoshi 400, 14px), duration aside (warm-gray)
  - Right: status label (same typographic style as admin)
- Active rentals: 3px forest green left border on the card
- Card background: warm-stone, inner shadow, border-radius 6px, 1px sand border

### 4.3 Rental Detail Page

- Vehicle hero: make/model in Fraunces 600 28px, registration in Plex Mono 18px below, status inline
- Sections with 40px spacing:
  - **Okres wynajmu:** dates in Plex Mono, duration in warm-gray aside
  - **Koszt:** pricing breakdown — labels left (Satoshi), values right (Plex Mono). Gross total in Fraunces 500, larger, forest green.
  - **Umowa:** contract info, "Pobierz PDF" as forest green text link with arrow
  - **Zwrot** (if returned): mileage, fuel, cleanliness in two-column key-value layout
- Each section: Fraunces heading + 40px sand underline

---

## 5. Mobile App

### 5.1 General

- Background: `#FDFAF6` (cream), no noise texture (doesn't render well at varying pixel densities)
- Cards: sage-wash (`#F5F9F7`) background
- Same color palette as web
- Fonts: Fraunces, Satoshi, IBM Plex Mono loaded via expo-font

### 5.2 Tab Bar

- Cream background, 1px sand border on top (no shadow)
- Active tab: forest green icon + label, small 4px forest green dot centered below icon
- Inactive tabs: icon only (warm gray), no label — labels appear only for active tab
- Tab bar height: 60px + safe area inset

### 5.3 Navigation Headers

- Screen title: Fraunces 600, 24px, charcoal, left-aligned
- Back button: `←` character in Satoshi, forest green, 44px tap target
- No background color — bleeds into cream content
- Thin sand line appears only when content scrolls underneath (scroll-triggered)

### 5.4 Home/Dashboard

- Greeting: "Cześć, [name]" in Fraunces 500, charcoal. Date below in Satoshi 400, warm-gray.
- Overdue alert (conditional): full-width bar, 4px terracotta left edge, amber tint background, terracotta text. Not a card.
- Stat row (horizontal scroll): 3 items separated by vertical sand dividers (not cards):
  - Number: Fraunces 600, 28px, forest green (terracotta for overdue)
  - Label: Satoshi 400, 12px, warm-gray
- Quick actions: two buttons side-by-side (primary + secondary), 8px radius, full row width
- Upcoming returns: flat list, sand dividers, registration in Plex Mono, full-row tap target

### 5.5 New Rental Wizard

**Stepper:** horizontal row of step numbers in Plex Mono:
- Current: forest green, Fraunces weight
- Completed: sage, number replaced by checkmark
- Future: sand color
- No dots, no progress bar

**Form inputs:** bottom-border only (sand, turns forest green on focus). Label above in Satoshi 500 warm-gray, animates to forest green + smaller size on focus (200ms).

**Search results:** flat list below search field (pushes content down, not a dropdown/overlay).

**Selection (vehicle/customer):** selected item gets sage-wash bg + forest green checkmark right-aligned. Full-row tap target.

### 5.6 Return Flow

Same wizard stepper as new rental.

**Damage map:** car silhouette in charcoal on cream. Damage pins: terracotta circles with white Plex Mono numbers. Tap opens bottom sheet (not modal) with sage-wash background.

### 5.7 Rentals List

**Filter chips:** text-only in Satoshi 500. Active: forest green text + 2px forest green underline. Inactive: warm gray. Horizontal scroll.

**List items:** flat list, sand dividers:
- Customer name: Satoshi 500, charcoal
- Vehicle + plate: Satoshi 400 warm-gray + Plex Mono
- Status: typographic label (same as web)
- Date range: Plex Mono, warm-gray, right-aligned

### 5.8 Profile

- Avatar: Fraunces initial in forest green circle (matching web)
- Settings list: sand dividers, toggle switches in forest green (not iOS blue default)
- Version: Plex Mono, warm-gray, small, bottom

---

## 6. Shared Patterns Across All Apps

### Status Label System

All three apps use identical status rendering:
- Satoshi 600, 11px (web) / 11px (mobile), uppercase
- Text color + 8% opacity background tint (not colored pills)
- AKTYWNY/WYNAJĘTY → sage
- SZKIC → warm-gray
- PRZEDŁUŻONY → amber-glow
- ZALEGŁY → terracotta
- ZWRÓCONY → warm-gray

### Data Display

- Prices always in IBM Plex Mono, right-aligned
- Dates in IBM Plex Mono, format DD.MM.YYYY
- Registration plates in IBM Plex Mono, uppercase
- Currency: always show "zł" suffix, net/gross labeled

### Brand Elements

- KITEK wordmark: always Fraunces 600, forest green
- User avatars: Fraunces initial letter in forest green circle, cream text
- Section headings: Fraunces + partial sand underline (40px, left-aligned)
- Primary interaction color: always forest green
- Danger/attention: always terracotta

---

## 7. Implementation Constraints

- **No backend changes** — all changes are CSS, component markup, and styling
- **No functionality changes** — every button, form, table, and interaction keeps its current behavior
- **shadcn/ui components** stay as the base but are heavily restyled via CSS variables and className overrides
- **Tailwind 4** CSS variables system is used for the web theme tokens
- **React Native StyleSheet** for mobile (NativeWind disabled for SDK 54 compatibility)
- **Font files** need to be added to the project (Fraunces from Google Fonts, Satoshi from fontshare.com, IBM Plex Mono from Google Fonts)
- **Existing hooks, queries, API calls, and state management** are not touched

---

## 8. Files Affected (Estimated)

### Web Admin Panel
- `apps/web/src/app/globals.css` — complete theme token overhaul
- `apps/web/src/app/layout.tsx` — font loading (Fraunces, Satoshi, Plex Mono)
- `apps/web/src/app/(admin)/layout.tsx` — layout structure adjustments
- `apps/web/src/components/layout/sidebar.tsx` — collapsible shelf redesign
- `apps/web/src/components/layout/top-bar.tsx` — transparent top bar
- `apps/web/src/components/layout/breadcrumbs.tsx` — styling update
- `apps/web/src/components/ui/*.tsx` — button, card, table, badge, input, form restyling
- `apps/web/src/components/data-table/*.tsx` — table redesign
- `apps/web/src/components/dashboard/*.tsx` — stat cards, activity feed
- `apps/web/src/app/(admin)/page.tsx` — dashboard layout
- All page files — minor className updates for new design tokens

### Client Portal
- `apps/web/src/app/(portal)/layout.tsx` — single-column editorial layout
- `apps/web/src/app/(portal)/portal/components/*.tsx` — all portal components restyled

### Mobile App
- `apps/mobile/src/lib/constants.ts` — color tokens update
- `apps/mobile/src/components/*.tsx` — all shared components restyled
- `apps/mobile/app/(tabs)/_layout.tsx` — tab bar redesign
- `apps/mobile/app/(tabs)/index.tsx` — dashboard redesign
- `apps/mobile/app/(tabs)/new-rental/*.tsx` — wizard stepper, form inputs
- `apps/mobile/app/(tabs)/rentals/*.tsx` — list and detail views
- `apps/mobile/app/(tabs)/profile.tsx` — profile screen
- `apps/mobile/app/return/*.tsx` — return flow screens
- `apps/mobile/app/login.tsx` — login screen
- Font assets added to `apps/mobile/assets/fonts/`
