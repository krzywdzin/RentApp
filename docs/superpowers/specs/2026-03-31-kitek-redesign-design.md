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
| `--portal-cream` | `#FDF9F3` | `oklch(0.982 0.010 80)` | Portal-specific background (warmer) |

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
- Satoshi 600, 11px (web) / 12px (mobile), uppercase
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

## 7. Login Pages

### 7.1 Web Login (`apps/web/src/app/login/page.tsx`)

- Full-viewport centered layout on cream background with noise grain
- KITEK wordmark in Fraunces 600, 36px, forest green, centered above the form
- Tagline below: "Wynajem Pojazdów" in Satoshi 400, warm-gray, 14px
- Login card: warm-stone background, inner shadow, border-radius 6px, max-width 380px
- Card top-edge: 2px forest green
- Form inputs: same as Section 3.6 (full border, sand, green on focus)
- "Zaloguj się" button: full-width primary (forest green)
- Error message: terracotta text below form, Satoshi 400, 13px
- Account locked state: terracotta top-edge card accent instead of green, with amber-glow warning icon

### 7.2 Mobile Login (`apps/mobile/app/login.tsx`)

- Cream background, KITEK wordmark centered (Fraunces 600, 28px, forest green)
- Form in upper-third of screen (not dead-center — more natural position)
- Inputs: bottom-border style (same as wizard forms)
- Login button: full-width primary, forest green
- Error states: terracotta text below input fields
- Biometric prompt: forest green icon, Satoshi text

---

## 8. Utility States & Overlays

### 8.1 Empty States

**Web (`empty-state.tsx`):**
- Centered in the content area, vertical stack
- Illustration: none (no generic SVG blobs). Instead: the section heading in Fraunces 500 at 48px, warm-gray at 15% opacity, as a watermark behind the message
- Message: Satoshi 400, 14px, warm-gray
- Action button (if any): secondary button style (forest green outline)

**Mobile (`EmptyState.tsx`):**
- Centered vertically in available space
- Message: Satoshi 400, 16px, warm-gray
- Action button: secondary style
- No icons or illustrations

### 8.2 Error States

**Web (`error-state.tsx`):**
- Card with terracotta top-edge (2px), warm-stone background, inner shadow
- Heading: Fraunces 500, 18px, terracotta
- Message: Satoshi 400, 14px, charcoal
- Retry button: secondary style (forest green outline)
- No AlertCircle icon — terracotta accent is sufficient signal

**Mobile (`ErrorBoundary.tsx`):**
- Cream background, centered content
- Heading: Fraunces 500, 20px, terracotta
- Message: Satoshi 400, 16px, charcoal
- Retry button: primary style

### 8.3 Loading Skeletons

**Web (`skeleton.tsx`):**
- Skeleton color: sand (`#E8DFD5`) with shimmer animation
- Shimmer: left-to-right gradient sweep (sand → warm-stone → sand), 1.5s infinite, ease-in-out
- Shapes match the component they replace (row height 52px for tables, card dimensions for cards)
- No pulse animation — shimmer only

**Mobile (`LoadingSkeleton.tsx`):**
- Same sand shimmer approach
- Adapted to mobile component shapes (stat row, list items, cards)

### 8.4 Toast Notifications (Sonner)

- Background: charcoal (`#2C2C2C`), text: cream
- Border-radius: 6px, no border
- Typography: Satoshi 400, 13px
- **Success variant:** forest green left-edge 3px bar
- **Error variant:** terracotta left-edge 3px bar
- **Info variant:** soft-teal left-edge 3px bar
- Animation: slide in from bottom-right, 250ms ease-out
- No icons in toasts — the colored bar differentiates

### 8.5 Dialogs & Modals

**Web (`dialog.tsx`):**
- Overlay: charcoal at 40% opacity, backdrop-blur 4px
- Dialog: warm-stone background, inner shadow, border-radius 6px, max-width 480px
- Header: Fraunces 500, 18px, charcoal. No close X — actions are in the footer.
- Body: Satoshi 400, 14px
- Footer: right-aligned buttons (secondary + primary), 12px gap
- Confirmation dialogs (delete/archive): terracotta top-edge accent on the dialog

**Mobile (`ConfirmationDialog.tsx`):**
- Overlay: charcoal at 50% opacity
- Dialog: warm-stone bg, border-radius 8px, centered, 90% width
- Header: Fraunces 500, 18px. Body: Satoshi 400, 16px.
- Buttons: stacked full-width (destructive on top if applicable, secondary below)

**Mobile Bottom Sheets (damage detail, etc.):**
- Handle bar: 40px wide, 4px height, sand color, centered at top with 8px margin
- Background: sage-wash
- Corner radius: 12px top-left/top-right only
- Overlay: charcoal at 30% opacity
- Slide-up animation: 300ms ease-out

### 8.6 Dropdown Menus (`dropdown-menu.tsx`)

- Background: warm-stone, 1px sand border, border-radius 6px
- Inner shadow: same as cards
- Item: Satoshi 400, 14px, charcoal. Hover: sage-wash background.
- Destructive item: terracotta text. Hover: terracotta at 8% opacity background.
- Separator: 1px sand line
- No icons in menu items unless the existing codebase uses them

### 8.7 Offline Banner (Mobile)

- Full-width bar at top of screen, below status bar
- Background: amber-glow at 15% opacity
- Text: "Brak połączenia" in Satoshi 500, amber-glow color, 13px, centered
- Height: 28px
- Appears with slide-down 200ms, disappears with slide-up 200ms

---

## 9. Form Components (Extended)

### 9.1 Select Inputs (`select.tsx`)

- Same as text input: full border, 1px sand, 6px radius
- Chevron icon: warm-gray, rotates on open (180deg, 150ms)
- Focus: forest green border + glow ring
- Dropdown: same styling as dropdown menu (warm-stone, inner shadow)
- Selected option: sage-wash background in the dropdown list

### 9.2 Checkboxes (`checkbox.tsx`)

- Unchecked: 16px square, 1px sand border, 3px radius, warm-stone fill
- Checked: forest green fill, cream checkmark icon, 150ms transition
- Focus: forest green glow ring
- Disabled: sand fill, no border change, 50% opacity

### 9.3 Textarea (`textarea.tsx`)

- Same border treatment as text input (sand, green on focus)
- Min-height: 100px
- Resize: vertical only
- Font: Satoshi 400, 14px (web), 16px (mobile)

### 9.4 Date Picker / Calendar (`calendar.tsx`)

- Calendar popover: warm-stone background, inner shadow, 6px radius
- Day cells: Satoshi 400, charcoal. Hover: sage-wash.
- Selected day: forest green background, cream text, 4px radius
- Today: underlined with forest green (no background)
- Range selection: sage-wash fill between start and end
- Navigation arrows: warm-gray, hover forest green
- Month/year header: Fraunces 500, charcoal

### 9.5 Tabs (`tabs.tsx`)

- Tab list: no background, sand border-bottom 1px
- Active tab: forest green text, Satoshi 600, 2px forest green border-bottom (overlays the sand line)
- Inactive tab: warm-gray text, Satoshi 400
- Hover: sage text, 150ms transition
- No pill/background treatment on tabs

### 9.6 Disabled States (all components)

- Opacity: 0.5
- Cursor: not-allowed
- No color changes — just opacity reduction
- Applies to buttons, inputs, selects, checkboxes

### 9.7 Tooltips (`tooltip.tsx`)

- Background: charcoal, text: cream, Satoshi 400, 12px
- Border-radius: 4px, padding: 6px 10px
- Arrow: 6px charcoal triangle
- Animation: fade-in 150ms

---

## 10. Remaining Admin Pages

### 10.1 Audit Trail (`audyt/page.tsx`)

Standard table pattern (Section 3.3) with:
- Columns: timestamp (Plex Mono), user (Satoshi), action (Satoshi), entity (Satoshi + Plex Mono for IDs)
- No special treatment — apply standard table design
- Filter bar: same input/select styling from Sections 3.6 and 9.1

### 10.2 Users Management (`uzytkownicy/page.tsx`)

Standard table pattern with:
- User avatar: Fraunces initial in forest green circle (consistent with top-bar and mobile profile)
- Role badge: same typographic label system as status badges
- Archive/delete actions: dropdown menu (Section 8.6)

### 10.3 Contracts List (`umowy/page.tsx`, `umowy/[id]/page.tsx`)

- List: standard table pattern
- Detail: standard detail page pattern (Section 3.8) with PDF download link as forest green ghost button

### 10.4 Calendar View (`wynajmy/calendar-view.tsx`)

- Calendar grid: warm-stone cell backgrounds, 1px sand borders
- Today cell: cream background with forest green left-edge 2px bar
- Rental blocks on calendar: sage fill (active), warm-gray fill (returned), terracotta fill (overdue)
- Text inside blocks: Satoshi 400, 11px, charcoal

### 10.5 Edit & Create Forms

All edit (`edytuj/`) and create (`nowy/`) pages use the standard form component styling from Sections 3.6 and 9:
- Page title: Fraunces 600, "Edytuj [entity]" or "Nowy [entity]"
- Form layout: single-column, max-width 640px
- Submit button: primary style, right-aligned
- Cancel: ghost button left of submit

### 10.6 Rental Documentation (`wynajmy/[id]/dokumentacja/page.tsx`)

Standard detail page pattern. Photo comparison components:
- Photo containers: 1px sand border, 6px radius, warm-stone background
- Side-by-side layout (split view)
- Damage pins: terracotta dots with white numbers (matching mobile pattern)

### 10.7 Filter Bars (vehicles, rentals, customers, audit)

- Inline with page content, below the page title
- Inputs/selects: same form component styling, arranged horizontally
- Active filters: forest green text with small X to clear, sage-wash pill background
- "Wyczyść filtry" reset link: ghost button style

### 10.8 Import Dialog (`pojazdy/import-dialog.tsx`)

Standard dialog styling (Section 8.5) with:
- File drop zone: dashed sand border, warm-stone background, sage-wash on drag-over
- Upload button: secondary style

---

## 11. Mobile Sub-Flows (Extended)

### 11.1 Rental Detail (`rentals/[id].tsx`)

- Screen title: vehicle make/model in Fraunces 600
- Status label inline with title
- Content sections with 24px spacing:
  - Customer card: sage-wash bg, name in Satoshi 500, phone/email in Satoshi 400 warm-gray
  - Vehicle card: registration in Plex Mono, details in Satoshi
  - Dates: Plex Mono values, duration in warm-gray aside
  - Pricing: right-aligned Plex Mono, gross total in Fraunces forest green
- "Rozpocznij zwrot" button: full-width primary at bottom (if ACTIVE/EXTENDED)
- Return data section (if returned): warm-stone background card with data in Plex Mono

### 11.2 New Rental — Photos Screen

- Photo grid: 2x2, each cell a rounded (8px) warm-stone rectangle
- Empty cell: dashed sand border, camera icon in warm-gray center
- Captured photo: fills the cell, 1px sand border
- Retake: small terracotta "X" circle at top-right corner of captured photo
- "Pomiń" skip link: ghost style at bottom

### 11.3 New Rental — Signatures Screen

- Landscape orientation
- Signature canvas: cream background with 1px sand border, full available width
- Label above: Satoshi 500, warm-gray ("Podpis klienta — strona 1")
- Clear button: ghost style (terracotta text)
- Confirm button: primary style
- Page indicator: Plex Mono "1/4" in warm-gray

### 11.4 New Rental — Contract Review

- Summary card: warm-stone background, inner shadow
- Key-value pairs: label (Satoshi 500, warm-gray) + value (Satoshi 400 or Plex Mono, charcoal)
- RODO checkbox: redesigned checkbox (Section 9.2) with Satoshi 400 label text
- "Dalej" button: primary, full-width

### 11.5 New Rental — Success Screen

- Centered layout on cream
- Checkmark: large (64px) forest green circle with cream check inside
- Heading: Fraunces 600, 22px, "Wynajęcie utworzone pomyślnie"
- Two buttons stacked: "Nowe wynajęcie" (primary) + "Strona główna" (secondary)

### 11.6 Return — Mileage Screen

- Current mileage display: Plex Mono, 18px, warm-gray label above
- Input: large (24px Plex Mono) bottom-border style, centered
- Distance calculated: displayed below in Satoshi 400, forest green if reasonable, amber-glow if >10,000km warning
- Warning banner: same style as overdue alert (amber tint bg, amber-glow text)

### 11.7 Return — Notes Screen

- Textarea: full-width, bottom-border style matching form inputs, min-height 120px
- "Opcjonalne" label in warm-gray italic
- Continue button: primary, full-width at bottom

### 11.8 Return — Confirm Screen

- Summary card (same pattern as contract review)
- All entered data displayed: mileage (Plex Mono), damage count, notes preview
- "Zatwierdź zwrot" button: primary, full-width
- Loading state: button shows spinner, disabled

---

## 12. Responsive Behavior & Dark Mode

### 12.1 Responsive Breakpoints (Web)

- **>=1280px:** Full layout — expanded sidebar (240px) + content
- **1024–1279px:** Sidebar auto-collapses to 56px strip. Content fills remaining space.
- **768–1023px:** Sidebar hidden, hamburger icon in top-bar to toggle overlay sidebar. Tables scroll horizontally.
- **<768px:** Not a primary target (mobile app covers this), but portal should be usable: single-column, stacked cards.

### 12.2 Dark Mode

Dark mode is **deferred** — not in scope for this redesign. The current dark theme is being replaced by the light "Boutique Fintech" theme. All dark class references will be removed. A dark variant may be designed as a future milestone.

---

## 13. Texture Specifications

### 13.1 Noise Grain Overlay

Applied as a `::before` pseudo-element on `body`:
```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
}
```

### 13.2 Sidebar Linen Texture (Collapsed State)

```css
.sidebar-collapsed {
  background-color: var(--forest-green);
  background-image:
    repeating-linear-gradient(
      0deg,
      rgba(255,255,255,0.03) 0px,
      rgba(255,255,255,0.03) 1px,
      transparent 1px,
      transparent 3px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(255,255,255,0.02) 0px,
      rgba(255,255,255,0.02) 1px,
      transparent 1px,
      transparent 5px
    );
}
```

---

## 14. Implementation Constraints (unchanged from original)

- **No backend changes** — all changes are CSS, component markup, and styling
- **No functionality changes** — every button, form, table, and interaction keeps its current behavior
- **shadcn/ui components** stay as the base but are heavily restyled via CSS variables and className overrides
- **Tailwind 4** CSS variables system is used for the web theme tokens
- **React Native StyleSheet** for mobile (NativeWind disabled for SDK 54 compatibility)
- **Font files** need to be added to the project (Fraunces from Google Fonts, Satoshi from fontshare.com, IBM Plex Mono from Google Fonts)
- **Existing hooks, queries, API calls, and state management** are not touched

---

## 15. Files Affected (Estimated)

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
