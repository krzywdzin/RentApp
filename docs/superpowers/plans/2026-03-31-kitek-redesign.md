# KITEK Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all three KITEK frontend apps (web admin, client portal, mobile) from generic dark shadcn to a warm "Boutique Fintech" aesthetic — without touching backend or changing functionality.

**Architecture:** Layer-by-layer transformation: theme tokens first, then shared UI components, then layout shells, then individual pages. Each layer builds on the previous. Web admin and mobile are independent tracks that can run in parallel after their respective foundations are laid.

**Tech Stack:** Next.js 15 + Tailwind 4 + shadcn/ui (web), Expo SDK 54 + React Native StyleSheet (mobile), Fraunces + Satoshi + IBM Plex Mono (typography)

**Spec:** `docs/superpowers/specs/2026-03-31-kitek-redesign-design.md`

---

## Task 1: Web — Font Assets & Loading

**Files:**
- Modify: `apps/web/src/app/layout.tsx`
- Create: `apps/web/public/fonts/Satoshi-Variable.woff2`
- Create: `apps/web/public/fonts/Satoshi-Variable.woff2` (download required)

- [ ] **Step 1: Download Satoshi font files**

Satoshi is not on Google Fonts. Download from fontshare.com (free for commercial use).

```bash
cd apps/web/public
mkdir -p fonts
# Download Satoshi Variable font files from fontshare.com
# Place Satoshi-Variable.woff2 and Satoshi-VariableItalic.woff2 in public/fonts/
```

Verify files exist in `apps/web/public/fonts/`.

- [ ] **Step 2: Update layout.tsx with all three font families**

Replace the current Inter import with Fraunces + IBM Plex Mono from next/font/google, and add Satoshi as a local font via next/font/local.

Current `apps/web/src/app/layout.tsx` (22 lines):
- Remove: `import { Inter } from "next/font/google"` and its instantiation
- Add: Fraunces and IBM_Plex_Mono from `next/font/google`, Satoshi from `next/font/local`
- Set CSS variables: `--font-display`, `--font-body`, `--font-data`
- Apply all three font variable classes to `<body>`
- Remove `className="dark"` from `<html>` tag (dark mode is being dropped per spec Section 12.2)

```tsx
import { Fraunces, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-data",
  display: "swap",
  weight: ["400", "500"], // spec says 450 but next/font doesn't support it; 400+500 cover the range
});

const satoshi = localFont({
  src: [
    { path: "../../public/fonts/Satoshi-Variable.woff2", style: "normal" },
    { path: "../../public/fonts/Satoshi-VariableItalic.woff2", style: "italic" },
  ],
  variable: "--font-body",
  display: "swap",
});
```

Body className: `cn(fraunces.variable, satoshi.variable, ibmPlexMono.variable, "font-body")`

- [ ] **Step 3: Verify the app builds**

Run: `cd apps/web && npx next build 2>&1 | tail -20`
Expected: Build succeeds (or only pre-existing warnings)

- [ ] **Step 4: Commit**

```bash
git add apps/web/public/fonts/ apps/web/src/app/layout.tsx
git commit -m "feat(web): add Fraunces, Satoshi, IBM Plex Mono fonts"
```

---

## Task 2: Web — Theme Tokens (globals.css)

**Files:**
- Modify: `apps/web/src/app/globals.css`

This is the foundational change. Every shadcn component reads from these CSS variables.

- [ ] **Step 1: Rewrite globals.css with new palette and font families**

Replace the entire contents of `apps/web/src/app/globals.css`. The new file:

```css
@import "tailwindcss";

@theme inline {
  /* Typography */
  --font-display: var(--font-display);
  --font-body: var(--font-body);
  --font-data: var(--font-data);

  /* Color Palette */
  --color-cream: oklch(0.984 0.008 80);
  --color-warm-stone: oklch(0.946 0.012 75);
  --color-sage-wash: oklch(0.975 0.010 160);
  --color-amber-tint: oklch(0.973 0.012 85);
  --color-sand: oklch(0.900 0.014 70);
  --color-charcoal: oklch(0.250 0.000 0);
  --color-warm-gray: oklch(0.530 0.010 65);
  --color-forest-green: oklch(0.330 0.060 160);
  --color-sage: oklch(0.440 0.070 160);
  --color-terracotta: oklch(0.560 0.150 40);
  --color-amber-glow: oklch(0.740 0.120 80);
  --color-soft-teal: oklch(0.620 0.060 170);
  --color-portal-cream: oklch(0.982 0.010 80);

  /* Stat card tints */
  --color-sage-tint: #F0F7F4;
  --color-teal-tint: #F0F7F7;
  --color-terracotta-tint: #FDF5F3;

  /* shadcn token mapping */
  --color-background: var(--color-cream);
  --color-foreground: var(--color-charcoal);
  --color-card: var(--color-warm-stone);
  --color-card-foreground: var(--color-charcoal);
  --color-popover: var(--color-warm-stone);
  --color-popover-foreground: var(--color-charcoal);
  --color-primary: var(--color-forest-green);
  --color-primary-foreground: var(--color-cream);
  --color-secondary: var(--color-sage-wash);
  --color-secondary-foreground: var(--color-forest-green);
  --color-muted: var(--color-warm-stone);
  --color-muted-foreground: var(--color-warm-gray);
  --color-accent: var(--color-sage-wash);
  --color-accent-foreground: var(--color-forest-green);
  --color-destructive: var(--color-terracotta);
  --color-destructive-foreground: var(--color-cream);
  --color-border: var(--color-sand);
  --color-input: var(--color-sand);
  --color-ring: var(--color-forest-green);
  --color-chart-1: var(--color-forest-green);
  --color-chart-2: var(--color-sage);
  --color-chart-3: var(--color-soft-teal);
  --color-chart-4: var(--color-amber-glow);
  --color-chart-5: var(--color-terracotta);
  --color-success: var(--color-sage);
  --color-warning: var(--color-amber-glow);

  /* Sidebar tokens */
  --color-sidebar: var(--color-warm-stone);
  --color-sidebar-foreground: var(--color-charcoal);
  --color-sidebar-primary: var(--color-forest-green);
  --color-sidebar-primary-foreground: var(--color-cream);
  --color-sidebar-accent: var(--color-sage-wash);
  --color-sidebar-accent-foreground: var(--color-forest-green);
  --color-sidebar-border: var(--color-sand);
  --color-sidebar-ring: var(--color-forest-green);

  /* Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
}

@layer base {
  *,
  *::before,
  *::after {
    border-color: var(--color-border);
  }

  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-body), ui-sans-serif, system-ui, sans-serif;
  }

  /* Noise grain overlay — spec Section 13.1 */
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
}

/* Shimmer animation for skeletons — spec Section 8.3 */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Button loading spinner — spec Section 9.12 */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Utility classes for the design system */
@layer utilities {
  .font-display {
    font-family: var(--font-display), ui-serif, Georgia, serif;
  }
  .font-body {
    font-family: var(--font-body), ui-sans-serif, system-ui, sans-serif;
  }
  .font-data {
    font-family: var(--font-data), ui-monospace, monospace;
  }
  .animate-shimmer {
    background: linear-gradient(90deg, var(--color-sand) 25%, var(--color-warm-stone) 50%, var(--color-sand) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite ease-in-out;
  }
  .shadow-inner-soft {
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.04);
  }
  .focus-ring-green {
    box-shadow: 0 0 0 3px rgba(27,67,50,0.12);
  }
}
```

- [ ] **Step 2: Verify the app builds and renders**

Run: `cd apps/web && npx next build 2>&1 | tail -20`
Expected: Build succeeds. The app will look partially broken (components still have old classes) — that is expected.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "feat(web): replace dark theme with Boutique Fintech palette"
```

---

## Task 3: Web — Core UI Components (shadcn overhaul)

**Files:**
- Modify: `apps/web/src/components/ui/button.tsx`
- Modify: `apps/web/src/components/ui/card.tsx`
- Modify: `apps/web/src/components/ui/badge.tsx`
- Modify: `apps/web/src/components/ui/input.tsx`
- Modify: `apps/web/src/components/ui/skeleton.tsx`
- Modify: `apps/web/src/components/ui/textarea.tsx`
- Modify: `apps/web/src/components/ui/checkbox.tsx`
- Modify: `apps/web/src/components/ui/dialog.tsx`
- Modify: `apps/web/src/components/ui/dropdown-menu.tsx`
- Modify: `apps/web/src/components/ui/select.tsx`
- Modify: `apps/web/src/components/ui/tabs.tsx`
- Modify: `apps/web/src/components/ui/tooltip.tsx`
- Modify: `apps/web/src/components/ui/popover.tsx`
- Modify: `apps/web/src/components/ui/scroll-area.tsx`
- Modify: `apps/web/src/components/ui/calendar.tsx`
- Modify: `apps/web/src/components/ui/empty-state.tsx`
- Modify: `apps/web/src/components/ui/error-state.tsx`
- Modify: `apps/web/src/components/ui/info-row.tsx`
- Modify: `apps/web/src/components/ui/form.tsx`

This is the largest single task. Each component needs its Tailwind classes updated to match the spec.

- [ ] **Step 1: Restyle button.tsx**

Update CVA variants (spec Section 3.5):
- Base: `font-body font-semibold rounded-md transition-colors duration-150` (6px = rounded-md)
- default (primary): `bg-forest-green text-cream hover:bg-sage`
- destructive: `bg-terracotta text-cream hover:bg-terracotta/90`
- outline (secondary): `border border-forest-green text-forest-green bg-transparent hover:bg-sage-wash`
- ghost: `text-forest-green hover:underline`
- link: `text-forest-green underline-offset-4 hover:underline`
- Sizes stay similar but default height h-10 (40px)
- Add disabled state: `disabled:opacity-50 disabled:cursor-not-allowed`
- Focus: `focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-forest-green/12`

- [ ] **Step 2: Restyle card.tsx**

Update Card classes (spec Section 3.4):
- Card: `rounded-md border border-sand bg-warm-stone shadow-inner-soft` (remove rounded-xl, remove shadow-sm)
- Add top accent support: optional `accent` prop → `border-t-2 border-t-forest-green` (or terracotta/amber-glow)
- CardTitle: `font-display font-medium text-charcoal` (Fraunces)
- CardContent padding: `px-5 py-6` (20px sides, 24px top/bottom — asymmetric)
- CardDescription: `text-sm text-warm-gray font-body`

- [ ] **Step 3: Restyle badge.tsx**

Update CVA variants (spec Section 9.8):
- Base: `font-body font-semibold text-[11px] uppercase tracking-wide rounded px-2 py-0.5` (border-radius 4px, NOT rounded-full)
- Remove `rounded-full`
- default: `bg-sage/8 text-sage`
- secondary: `bg-warm-gray/8 text-warm-gray`
- destructive: `bg-terracotta/8 text-terracotta`
- success: `bg-sage/8 text-sage`
- warning: `bg-amber-glow/8 text-amber-glow`
- outline: `border border-sand text-warm-gray`
- Add new variant: `info` → `bg-soft-teal/8 text-soft-teal`
- Add role badge variants: `admin` → `bg-forest-green/8 text-forest-green`, `user` → `bg-warm-gray/8 text-warm-gray`, `manager` → `bg-soft-teal/8 text-soft-teal`

- [ ] **Step 4: Restyle input.tsx**

Update classes (spec Section 3.6):
- `h-10 w-full rounded-md border border-sand bg-transparent px-3 py-2 text-sm font-body text-charcoal`
- `placeholder:text-sand`
- `focus:border-forest-green focus:ring-[3px] focus:ring-forest-green/12 focus:outline-none`
- `disabled:opacity-50 disabled:cursor-not-allowed`

- [ ] **Step 5: Restyle skeleton.tsx**

Update classes (spec Section 8.3):
- Replace `animate-pulse rounded-md bg-muted` with `animate-shimmer rounded-md`
- The shimmer animation is defined in globals.css

- [ ] **Step 6: Restyle remaining UI components**

Apply spec styling to each component. Reference:
- `textarea.tsx` — spec Section 9.3: same border as input, min-h-[100px], resize-y, font-body
- `checkbox.tsx` — spec Section 9.2: 16px square, sand border, forest-green checked, 3px radius
- `dialog.tsx` — spec Section 8.5: warm-stone bg, inner shadow, charcoal/40% overlay, backdrop-blur-sm, no close X
- `dropdown-menu.tsx` — spec Section 8.6: warm-stone bg, sand border, inner shadow, sage-wash hover
- `select.tsx` — spec Section 9.1: same as input borders, warm-gray chevron, sage-wash selected
- `tabs.tsx` — spec Section 9.5: sand bottom-border, forest-green active with 2px bottom border
- `tooltip.tsx` — spec Section 9.7: charcoal bg, cream text, 12px Satoshi, 4px radius
- `popover.tsx` — spec Section 9.10: same as dropdown chrome, scale-from-0.95 animation
- `scroll-area.tsx` — spec Section 9.9: transparent track, sand thumb, warm-gray hover
- `calendar.tsx` — spec Section 9.4: warm-stone popover, forest-green selected, sage-wash hover
- `empty-state.tsx` — spec Section 8.1: Fraunces watermark at 48px/15% opacity behind message
- `error-state.tsx` — spec Section 8.2: terracotta top-edge card, Fraunces heading, no AlertCircle
- `info-row.tsx` — spec Section 9.14: horizontal layout (flex-row justify-between), label left warm-gray uppercase, value right
- `form.tsx` — spec Section 9.11: FormLabel warm-gray, FormMessage terracotta, FormDescription warm-gray 12px

- [ ] **Step 7: Verify the app builds**

Run: `cd apps/web && npx next build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/ui/
git commit -m "feat(web): restyle all shadcn UI components to Boutique Fintech design"
```

---

## Task 4: Web — Layout Shell (Sidebar + TopBar + Breadcrumbs)

**Files:**
- Modify: `apps/web/src/components/layout/sidebar.tsx`
- Modify: `apps/web/src/components/layout/top-bar.tsx`
- Modify: `apps/web/src/components/layout/breadcrumbs.tsx`
- Modify: `apps/web/src/app/(admin)/layout.tsx`

- [ ] **Step 1: Redesign sidebar.tsx**

Major changes (spec Section 3.1):
- **Expanded state (w-60 = 240px):**
  - Background: `bg-warm-stone` (was dark)
  - Logo: Replace "RentApp" text with "KITEK" in `font-display font-semibold text-forest-green text-xl`
  - Nav items: `font-body font-medium text-sm text-charcoal`
  - Active item: `bg-forest-green text-cream border-l-[3px] border-l-forest-green`
  - Hover: `hover:bg-sage-wash transition-colors duration-150`
  - Bottom "Quick Pulse" widget: two numbers (active rentals + overdue) in `font-data` with `text-warm-gray text-xs font-body` labels. Separated by a `border-t border-sand` divider from the nav.

- **Collapsed state (w-14 = 56px):**
  - Background: `bg-forest-green` with linen texture (spec Section 13.2 CSS)
  - Icons: `text-cream` 20px
  - Active icon: `bg-cream/20 rounded-md` pill behind icon
  - Add the linen texture CSS as an inline style or utility class

- **Transition:** `transition-all duration-250 ease-out` on the sidebar container, content area flexes to fill.

- [ ] **Step 2: Redesign top-bar.tsx**

Changes (spec Section 3.2):
- Remove background color and heavy border → `border-b border-sand` only
- User initials circle: `bg-forest-green text-cream font-display`
- Username: `font-body text-sm text-charcoal`
- Logout button: `text-warm-gray hover:text-terracotta`

- [ ] **Step 3: Update breadcrumbs.tsx**

Changes (spec Section 3.2):
- Text: `font-body text-sm text-warm-gray`
- Separators: `/` in `text-sand`
- Current page: `text-charcoal` (distinguishable from parent crumbs)

- [ ] **Step 4: Update admin layout.tsx**

- Remove any dark-mode-specific classes
- Ensure the main content area has `bg-cream` background
- Verify the flex layout accommodates the sidebar transition smoothly

- [ ] **Step 4b: Add responsive breakpoints (spec Section 12.1)**

In `sidebar.tsx`:
- `>=1280px`: expanded sidebar (240px) — default
- `1024-1279px`: auto-collapse to 56px strip (override localStorage preference)
- `768-1023px`: sidebar hidden entirely, add hamburger icon in top-bar to toggle overlay sidebar
- `<768px`: sidebar hidden (mobile app covers this)

Use a `useMediaQuery` hook or Tailwind responsive classes (`xl:w-60 lg:w-14 md:hidden`) to control sidebar width at different breakpoints. For the hamburger toggle at 768-1023px, add a Sheet/overlay pattern that slides the sidebar in from the left.

- [ ] **Step 5: Verify the app builds and test sidebar collapse**

Run: `cd apps/web && npx next build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/layout/ apps/web/src/app/\(admin\)/layout.tsx
git commit -m "feat(web): redesign sidebar, top bar, breadcrumbs for warm theme"
```

---

## Task 5: Web — Data Table Redesign

**Files:**
- Modify: `apps/web/src/components/data-table/data-table.tsx`
- Modify: `apps/web/src/components/data-table/data-table-pagination.tsx`
- Modify: `apps/web/src/components/data-table/data-table-column-header.tsx`
- Modify: `apps/web/src/components/ui/table.tsx` (if exists — the underlying Table primitive)

- [ ] **Step 1: Restyle the data table**

Changes (spec Section 3.3):
- Remove all grid lines/borders from table cells
- Column headers: `font-body font-medium text-xs uppercase tracking-wider text-warm-gray`
- Row height: `h-[52px]`
- Alternating rows: even rows `bg-amber-tint`, odd rows `bg-cream` (or transparent)
- Data cells with numbers/dates: `font-data` class
- Row hover: `hover:bg-sage-wash transition-colors duration-150`
- Empty state: use redesigned empty-state component
- Loading skeleton: use shimmer animation rows

- [ ] **Step 2: Restyle pagination**

Changes (spec Section 3.3):
- Replace numbered pagination buttons with simple prev/next arrows in `text-warm-gray hover:text-forest-green`
- Or a "Pokaż więcej" (show more) link in `text-forest-green font-body font-medium hover:underline`
- Remove page number buttons

- [ ] **Step 3: Restyle column header sort indicators**

Changes (spec Section 9.13):
- Inactive: warm-gray chevron at 30% opacity
- Active ascending: charcoal up-chevron at 100%
- Active descending: charcoal down-chevron at 100%
- Position: right of header text with 4px gap

- [ ] **Step 4: Verify build**

Run: `cd apps/web && npx next build 2>&1 | tail -20`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/data-table/ apps/web/src/components/ui/table.tsx
git commit -m "feat(web): redesign data tables with warm alternating rows and clean typography"
```

---

## Task 6: Web — Dashboard Page

**Files:**
- Modify: `apps/web/src/components/dashboard/stat-card.tsx`
- Modify: `apps/web/src/components/dashboard/activity-feed.tsx`
- Modify: `apps/web/src/app/(admin)/page.tsx`

- [ ] **Step 1: Redesign stat-card.tsx**

Changes (spec Section 3.7):
- Remove icon from stat card — the number is the visual
- Value: `font-display font-semibold text-3xl text-forest-green` (or `text-terracotta` for overdue)
- Label: `font-body text-xs text-warm-gray`
- Each card gets a unique tint background via prop:
  - `sage-tint` → `bg-[#F0F7F4]`
  - `amber-tint` → `bg-amber-tint`
  - `teal-tint` → `bg-[#F0F7F7]`
  - `terracotta-tint` → `bg-[#FDF5F3]`
- Card: inner shadow, 1px sand border, 6px radius. Remove drop shadow.
- Add count-up animation (spec Section 3.9): use a simple requestAnimationFrame counter, 400ms ease-out

- [ ] **Step 2: Restyle activity-feed.tsx**

Changes (spec Section 3.7):
- Flat list with `divide-y divide-sand` (sand-colored dividers)
- Timestamps: `font-data text-xs text-warm-gray`
- Description text: `font-body text-sm text-charcoal`

- [ ] **Step 3: Update dashboard page.tsx**

- Update stat card grid to pass correct tint variants
- Add staggered fade-in animation for cards (spec Section 3.9): each card delayed by +80ms, opacity 0→1 + translateY 8px→0 over 300ms ease-out. Use CSS animation-delay.

- [ ] **Step 4: Verify build**

Run: `cd apps/web && npx next build 2>&1 | tail -20`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/dashboard/ apps/web/src/app/\(admin\)/page.tsx
git commit -m "feat(web): redesign dashboard with tinted stat cards and staggered animation"
```

---

## Task 7: Web — Login Page

**Files:**
- Modify: `apps/web/src/app/login/page.tsx`

- [ ] **Step 1: Redesign login page**

Changes (spec Section 7.1):
- Full viewport centered layout: `min-h-screen flex items-center justify-center bg-cream`
- Replace "RentApp" with "KITEK" wordmark: `font-display font-semibold text-4xl text-forest-green text-center`
- Add tagline: `"Wynajem Pojazdów"` in `font-body text-warm-gray text-sm text-center mt-1`
- Login card: `bg-warm-stone shadow-inner-soft rounded-md border border-sand border-t-2 border-t-forest-green max-w-[380px] w-full p-6`
- Form inputs use the already-restyled input component
- Submit button: full-width primary
- Error message: `text-terracotta font-body text-sm mt-2`
- Account locked (423 status): change card top border to `border-t-terracotta`

- [ ] **Step 2: Verify build**

Run: `cd apps/web && npx next build 2>&1 | tail -20`

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/login/page.tsx
git commit -m "feat(web): redesign login page with KITEK branding"
```

---

## Task 8: Web — Admin List Pages (Vehicles, Customers, Rentals, Contracts, Audit, Users)

**Files:**
- Modify: `apps/web/src/app/(admin)/pojazdy/page.tsx`
- Modify: `apps/web/src/app/(admin)/pojazdy/columns.tsx`
- Modify: `apps/web/src/app/(admin)/klienci/page.tsx`
- Modify: `apps/web/src/app/(admin)/klienci/columns.tsx` (if exists)
- Modify: `apps/web/src/app/(admin)/wynajmy/page.tsx`
- Modify: `apps/web/src/app/(admin)/umowy/page.tsx`
- Modify: `apps/web/src/app/(admin)/audyt/page.tsx`
- Modify: `apps/web/src/app/(admin)/uzytkownicy/page.tsx`
- Modify: `apps/web/src/app/(admin)/pojazdy/import-dialog.tsx`
- Modify: Any filter-bar components in these directories

- [ ] **Step 1: Update page titles across all list pages**

All page titles should use: `font-display font-semibold text-2xl text-charcoal` (Fraunces 600, 28px)

- [ ] **Step 2: Update column definitions for typography**

In column definition files, apply:
- Name/text columns: `font-body text-sm text-charcoal`
- Number/date/ID columns: `font-data text-sm`
- Registration plates: `font-data uppercase`
- Status columns: use restyled Badge component (already done in Task 3)
- User avatar columns: `bg-forest-green text-cream font-display` circle

- [ ] **Step 3: Update filter bars**

Changes (spec Section 10.7):
- Inputs/selects: standard form styling (already restyled)
- Active filter pills: `bg-sage-wash text-forest-green font-body text-sm rounded px-2 py-0.5` with X close button
- Reset link: ghost button style

- [ ] **Step 4: Update calendar view (rentals page)**

Changes (spec Section 10.4):
- Calendar cells: `bg-warm-stone border border-sand`
- Today: `bg-cream border-l-2 border-l-forest-green`
- Rental blocks: 22px height, 3px radius, colored by status (sage/warm-gray/terracotta)

- [ ] **Step 5: Update import dialog**

Changes (spec Section 10.8):
- `apps/web/src/app/(admin)/pojazdy/import-dialog.tsx`: standard dialog styling (Task 3)
- File drop zone: `border-2 border-dashed border-sand bg-warm-stone` → on drag-over: `bg-sage-wash`
- Upload button: secondary style

- [ ] **Step 6: Verify build**

Run: `cd apps/web && npx next build 2>&1 | tail -20`

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/\(admin\)/
git commit -m "feat(web): restyle all admin list pages with new typography and filter bars"
```

---

## Task 9: Web — Admin Detail Pages & Forms

**Files:**
- Modify: `apps/web/src/app/(admin)/pojazdy/[id]/page.tsx`
- Modify: `apps/web/src/app/(admin)/pojazdy/[id]/edytuj/page.tsx`
- Modify: `apps/web/src/app/(admin)/pojazdy/nowy/page.tsx`
- Modify: `apps/web/src/app/(admin)/klienci/[id]/page.tsx`
- Modify: `apps/web/src/app/(admin)/klienci/[id]/edytuj/page.tsx`
- Modify: `apps/web/src/app/(admin)/klienci/nowy/page.tsx`
- Modify: `apps/web/src/app/(admin)/wynajmy/[id]/page.tsx`
- Modify: `apps/web/src/app/(admin)/wynajmy/[id]/edytuj/page.tsx`
- Modify: `apps/web/src/app/(admin)/wynajmy/nowy/page.tsx`
- Modify: `apps/web/src/app/(admin)/wynajmy/[id]/dokumentacja/page.tsx`
- Modify: `apps/web/src/app/(admin)/umowy/[id]/page.tsx`
- Modify: `apps/web/src/components/photos/photo-comparison.tsx`
- Modify: `apps/web/src/components/photos/damage-comparison.tsx`
- Modify: `apps/web/src/components/photos/damage-pin-list.tsx`

- [ ] **Step 1: Update all detail pages**

Apply spec Section 3.8 pattern:
- Page title: `font-display font-semibold text-2xl text-charcoal` with status badge inline
- Card sections: use restyled Card with 24px gap between (`space-y-6`)
- Section headings inside cards: `font-display font-medium text-base text-charcoal` with a partial sand underline below (40px wide, left-aligned): `<div className="w-10 h-px bg-sand mt-1" />`
- Key-value pairs: use restyled info-row (horizontal layout)
- Action buttons: top-right of page, not inside cards

- [ ] **Step 2: Update all edit/create form pages**

Apply spec Section 10.5:
- Page title: `font-display font-semibold text-2xl`
- Form: `max-w-[640px]` single column
- Submit: primary button right-aligned
- Cancel: ghost button left of submit

- [ ] **Step 3: Update documentation/photo components**

Apply spec Section 10.6:
- Photo containers: `border border-sand rounded-md bg-warm-stone`
- Damage pins: terracotta dots with white numbers

- [ ] **Step 4: Verify build**

Run: `cd apps/web && npx next build 2>&1 | tail -20`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(admin\)/ apps/web/src/components/photos/
git commit -m "feat(web): restyle admin detail pages, forms, and photo comparison"
```

---

## Task 10: Web — Client Portal

**Files:**
- Modify: `apps/web/src/app/(portal)/layout.tsx`
- Modify: `apps/web/src/app/(portal)/portal/page.tsx`
- Modify: `apps/web/src/app/(portal)/portal/[rentalId]/page.tsx`
- Modify: `apps/web/src/app/(portal)/portal/components/portal-header.tsx`
- Modify: `apps/web/src/app/(portal)/portal/components/rental-card.tsx`
- Modify: `apps/web/src/app/(portal)/portal/components/rental-detail-view.tsx`
- Modify: `apps/web/src/app/(portal)/portal/components/token-exchange.tsx`

- [ ] **Step 1: Redesign portal layout**

Changes (spec Section 4.1):
- Background: `bg-portal-cream` (slightly warmer)
- Max-width: `max-w-3xl` (keep existing, ~720px)
- Footer: `"KITEK Wynajem Pojazdów"` in `font-body text-warm-gray text-sm text-center`

- [ ] **Step 2: Redesign portal-header.tsx**

- KITEK wordmark: `font-display font-semibold text-xl text-forest-green` left-aligned
- Customer name: `font-body text-sm text-charcoal` right-aligned
- Divider: `border-b border-sand` below (no shadow)

- [ ] **Step 3: Redesign rental-card.tsx**

Changes (spec Section 4.2):
- Full-width horizontal card: `bg-warm-stone shadow-inner-soft rounded-md border border-sand`
- Active rentals: add `border-l-[3px] border-l-forest-green`
- Vehicle: `font-display font-medium text-base` + registration in `font-data text-sm text-warm-gray`
- Dates: `font-body text-sm` + duration in `text-warm-gray`
- Status: restyled Badge

- [ ] **Step 4: Redesign rental-detail-view.tsx**

Changes (spec Section 4.3):
- Vehicle hero: `font-display font-semibold text-2xl` + registration `font-data text-lg`
- Section headings: Fraunces + 40px sand underline
- Pricing: `font-data` right-aligned, gross total `font-display font-medium text-forest-green text-lg`
- PDF link: `text-forest-green font-body hover:underline`

- [ ] **Step 5: Redesign token-exchange.tsx**

Changes (spec Section 11.10):
- Loading: shimmer skeleton mimicking a rental card shape
- Error: terracotta accent card with `"Link wygasł lub jest nieprawidłowy"`

- [ ] **Step 6: Verify build**

Run: `cd apps/web && npx next build 2>&1 | tail -20`

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/\(portal\)/
git commit -m "feat(web): redesign client portal with editorial layout"
```

---

## Task 11: Web — Sonner Toast Theming

**Files:**
- Modify: `apps/web/src/lib/providers.tsx`

- [ ] **Step 1: Update Sonner Toaster theming**

Changes (spec Section 8.4):
- Apply custom Sonner theme via the `toastOptions` prop:
  - Background: charcoal (#2C2C2C)
  - Text: cream
  - Font: Satoshi 13px
  - Border-radius: 6px
  - Success: forest green left border
  - Error: terracotta left border

```tsx
<Toaster
  position="bottom-right"
  toastOptions={{
    className: "font-body text-[13px]",
    style: {
      background: "#2C2C2C",
      color: "#FDFAF6",
      borderRadius: "6px",
      border: "none",
    },
  }}
/>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/providers.tsx
git commit -m "feat(web): theme toast notifications with warm palette"
```

---

## Task 12: Mobile — Font Assets & Theme Constants

**Files:**
- Create: `apps/mobile/assets/fonts/Fraunces-Medium.ttf`
- Create: `apps/mobile/assets/fonts/Fraunces-SemiBold.ttf`
- Create: `apps/mobile/assets/fonts/Satoshi-Variable.ttf`
- Create: `apps/mobile/assets/fonts/Satoshi-VariableItalic.ttf`
- Create: `apps/mobile/assets/fonts/IBMPlexMono-Regular.ttf`
- Create: `apps/mobile/assets/fonts/IBMPlexMono-Medium.ttf`
- Modify: `apps/mobile/src/lib/constants.ts`
- Create: `apps/mobile/src/lib/theme.ts`

- [ ] **Step 1: Download and place font files**

```bash
cd apps/mobile/assets
mkdir -p fonts
# Download from Google Fonts: Fraunces (Medium 500, SemiBold 600), IBM Plex Mono (Regular 400, Medium 500)
# Download from fontshare.com: Satoshi Variable
# Place all .ttf files in assets/fonts/
```

- [ ] **Step 2: Create theme.ts with centralized design tokens**

Create `apps/mobile/src/lib/theme.ts`:

```typescript
export const colors = {
  cream: '#FDFAF6',
  warmStone: '#F3EDE7',
  sageWash: '#F5F9F7',
  amberTint: '#FBF7F0',
  sand: '#E8DFD5',
  charcoal: '#2C2C2C',
  warmGray: '#7A746D',
  forestGreen: '#1B4332',
  sage: '#2D6A4F',
  terracotta: '#C75D3A',
  amberGlow: '#D4A853',
  softTeal: '#5B9A8B',
  // Stat tints
  sageTint: '#F0F7F4',
  tealTint: '#F0F7F7',
  terracottaTint: '#FDF5F3',
} as const;

export const fonts = {
  display: 'Fraunces-SemiBold',    // 600
  displayMedium: 'Fraunces-Medium', // 500
  body: 'Satoshi-Variable',
  data: 'IBMPlexMono-Regular',
  dataMedium: 'IBMPlexMono-Medium',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  section: 40,
} as const;

export const radii = {
  sm: 4,
  md: 6,
  lg: 8,
  card: 6,
} as const;
```

- [ ] **Step 3: Update constants.ts with new status colors**

Update `RENTAL_STATUS_COLORS` in `apps/mobile/src/lib/constants.ts`:

```typescript
export const RENTAL_STATUS_COLORS: Record<string, string> = {
  DRAFT: '#7A746D',       // warm-gray
  ACTIVE: '#2D6A4F',      // sage
  RENTED: '#2D6A4F',      // sage
  EXTENDED: '#D4A853',    // amber-glow
  RETURNED: '#7A746D',    // warm-gray
  OVERDUE: '#C75D3A',     // terracotta
};
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/assets/fonts/ apps/mobile/src/lib/theme.ts apps/mobile/src/lib/constants.ts
git commit -m "feat(mobile): add font assets and centralized theme tokens"
```

---

## Task 13: Mobile — Font Loading in Root Layout

**Files:**
- Modify: `apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Add expo-font loading**

Add font loading to the root layout using `useFonts` from `expo-font`:

```typescript
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

// Inside the component:
const [fontsLoaded] = useFonts({
  'Fraunces-Medium': require('../assets/fonts/Fraunces-Medium.ttf'),
  'Fraunces-SemiBold': require('../assets/fonts/Fraunces-SemiBold.ttf'),
  'Satoshi-Variable': require('../assets/fonts/Satoshi-Variable.ttf'),
  'Satoshi-VariableItalic': require('../assets/fonts/Satoshi-VariableItalic.ttf'),
  'IBMPlexMono-Regular': require('../assets/fonts/IBMPlexMono-Regular.ttf'),
  'IBMPlexMono-Medium': require('../assets/fonts/IBMPlexMono-Medium.ttf'),
});

useEffect(() => {
  if (fontsLoaded) SplashScreen.hideAsync();
}, [fontsLoaded]);

if (!fontsLoaded) return null;
```

- [ ] **Step 2: Verify the app compiles**

Run: `cd apps/mobile && npx expo start --clear 2>&1 | head -20`
Expected: App starts without font loading errors

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/_layout.tsx
git commit -m "feat(mobile): load custom fonts via expo-font"
```

---

## Task 14: Mobile — Shared Components Restyling

**Files:**
- Modify: `apps/mobile/src/components/AppButton.tsx`
- Modify: `apps/mobile/src/components/AppCard.tsx`
- Modify: `apps/mobile/src/components/StatusBadge.tsx`
- Modify: `apps/mobile/src/components/WizardStepper.tsx`
- Modify: `apps/mobile/src/components/EmptyState.tsx`
- Modify: `apps/mobile/src/components/LoadingSkeleton.tsx`
- Modify: `apps/mobile/src/components/ConfirmationDialog.tsx`
- Modify: `apps/mobile/src/components/SearchBar.tsx`
- Modify: `apps/mobile/src/components/OfflineBanner.tsx`
- Modify: `apps/mobile/src/components/ErrorBoundary.tsx`

- [ ] **Step 1: Restyle AppButton.tsx**

Replace hardcoded colors with theme imports (spec Section 3.5 adapted for mobile):
```typescript
import { colors, fonts, radii } from '@/lib/theme';

const variantBg = {
  primary: { backgroundColor: colors.forestGreen },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.forestGreen },
  destructive: { backgroundColor: colors.terracotta },
};
const variantText = {
  primary: { color: colors.cream, fontFamily: fonts.body },
  secondary: { color: colors.forestGreen, fontFamily: fonts.body },
  destructive: { color: colors.cream, fontFamily: fonts.body },
};
```
- borderRadius: 6 (spec Section 3.5 — all buttons are 6px; only quick-action buttons on dashboard are 8px per Section 5.4)
- fontWeight: '600'
- Loading spinner: use cream color on primary, forest-green on secondary

- [ ] **Step 2: Restyle AppCard.tsx**

Replace (spec Section 3.4 adapted):
- backgroundColor: `colors.warmStone` (was white)
- borderColor: `colors.sand` (was zinc-200)
- borderRadius: `radii.card` (6, was 12)
- Remove drop shadow, add inner shadow via Platform.select:
  - iOS: `shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.04, shadowRadius: 1.5` (top-down inner feel)
  - Android: `elevation: 0` (remove elevation)

- [ ] **Step 3: Restyle StatusBadge.tsx**

Replace STATUS_MAP with new colors (spec Section 6):
```typescript
const STATUS_MAP = {
  ACTIVE: { bg: colors.sage + '14', fg: colors.sage, label: 'Aktywny' },
  RENTED: { bg: colors.sage + '14', fg: colors.sage, label: 'Aktywny' },
  DRAFT: { bg: colors.warmGray + '14', fg: colors.warmGray, label: 'Szkic' },
  EXTENDED: { bg: colors.amberGlow + '14', fg: colors.amberGlow, label: 'Przedłużony' },
  RETURNED: { bg: colors.warmGray + '14', fg: colors.warmGray, label: 'Zwrócony' },
  OVERDUE: { bg: colors.terracotta + '14', fg: colors.terracotta, label: 'Zaległy' },
};
```
- borderRadius: 4 (not rounded-full)
- fontFamily: `fonts.body`, fontWeight: '600', fontSize: 12, textTransform: 'uppercase'

- [ ] **Step 4: Restyle WizardStepper.tsx**

Complete redesign (spec Section 5.5):
- Remove dots and progress bar
- Horizontal row of step numbers in `font-data` (IBM Plex Mono)
- Current step: forest green, `font-display` weight
- Completed: sage, checkmark replaces number
- Future: sand color
- Remove track/fill elements

- [ ] **Step 5: Restyle remaining shared components**

- `EmptyState.tsx` — spec Section 8.1: centered, `font-body` 16px warm-gray, secondary button, no icons
- `LoadingSkeleton.tsx` — spec Section 8.3: sand color (`colors.sand`), shimmer via Animated opacity cycle
- `ConfirmationDialog.tsx` — spec Section 8.5: warm-stone bg, 8px radius, charcoal overlay 50%, Fraunces heading, stacked full-width buttons
- `SearchBar.tsx` — sand border, 8px radius, warm-gray magnifier, `font-body`
- `OfflineBanner.tsx` — spec Section 8.7: amber-glow at 15% bg, amber-glow text, 28px height, centered, slide-down 200ms
- `ErrorBoundary.tsx` — spec Section 8.2: cream bg, centered, Fraunces 500 20px terracotta heading, Satoshi 16px charcoal message, primary retry button

- [ ] **Step 6: Verify compilation**

Run: `cd apps/mobile && npx expo start --clear 2>&1 | head -20`

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/components/
git commit -m "feat(mobile): restyle all shared components with Boutique Fintech theme"
```

---

## Task 15: Mobile — Tab Bar & Navigation Headers

**Files:**
- Modify: `apps/mobile/app/(tabs)/_layout.tsx`
- Modify: `apps/mobile/app/(tabs)/new-rental/_layout.tsx`
- Modify: `apps/mobile/app/return/_layout.tsx`

- [ ] **Step 1: Redesign tab bar**

Changes (spec Section 5.2):
- `tabBarStyle`: cream background (`colors.cream`), `borderTopWidth: 1, borderTopColor: colors.sand` (not shadow)
- `tabBarActiveTintColor`: `colors.forestGreen`
- `tabBarInactiveTintColor`: `colors.warmGray`
- Active tab: show label. Inactive tabs: hide label (`tabBarShowLabel` dynamic per tab — or use custom tab bar component)
- Add small 4px forest green dot below active tab icon (requires custom `tabBarIcon` render)
- Tab bar height: 60px + safe area

- [ ] **Step 2: Restyle navigation headers (spec Section 5.3)**

In `apps/mobile/app/(tabs)/new-rental/_layout.tsx` and `apps/mobile/app/return/_layout.tsx`, update `screenOptions`:
- `headerStyle`: `{ backgroundColor: colors.cream }` (transparent, bleeds into content)
- `headerTitleStyle`: `{ fontFamily: fonts.display, fontSize: 24, color: colors.charcoal }`
- `headerTintColor`: `colors.forestGreen` (back arrow color)
- `headerShadowVisible: false` (remove default shadow — sand line appears on scroll via a scroll listener)
- Back button: left-aligned `←` character in `font-body`, forest green, 44px tap target

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/\(tabs\)/_layout.tsx apps/mobile/app/\(tabs\)/new-rental/_layout.tsx apps/mobile/app/return/_layout.tsx
git commit -m "feat(mobile): redesign tab bar and navigation headers"
```

---

## Task 16: Mobile — Dashboard Screen

**Files:**
- Modify: `apps/mobile/app/(tabs)/index.tsx`

- [ ] **Step 1: Redesign dashboard**

Changes (spec Section 5.4):
- Background: `colors.cream` (was white)
- Greeting: `font-display` fontWeight 500, `colors.charcoal`. Date: `font-body`, `colors.warmGray`
- Overdue alert: full-width bar with 4px terracotta left border, amber tint bg, terracotta text (not a card)
- Stat row: horizontal scroll with vertical sand dividers (not cards):
  - Number: `font-display` fontWeight 600, 28px, `colors.forestGreen` (terracotta for overdue)
  - Label: `font-body` 12px, `colors.warmGray`
- Quick actions: two buttons side-by-side, primary + secondary
- Upcoming returns: flat list with sand dividers, registration in `font-data`, full-row tap targets

- [ ] **Step 2: Verify compilation**

Run: `cd apps/mobile && npx expo start --clear 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/\(tabs\)/index.tsx
git commit -m "feat(mobile): redesign dashboard with stat row and warm palette"
```

---

## Task 17: Mobile — Rentals List & Detail

**Files:**
- Modify: `apps/mobile/app/(tabs)/rentals/index.tsx`
- Modify: `apps/mobile/app/(tabs)/rentals/[id].tsx`

- [ ] **Step 1: Restyle rentals list**

Changes (spec Section 5.7):
- Filter chips: text-only, active = forest green + 2px underline, inactive = warm-gray. Horizontal scroll.
- List items: flat list with sand dividers (`borderBottomWidth: 1, borderBottomColor: colors.sand`)
  - Customer name: `font-body` fontWeight 500, charcoal
  - Vehicle + plate: `font-body` warm-gray + `font-data`
  - Status: restyled StatusBadge
  - Date range: `font-data`, warm-gray, right-aligned

- [ ] **Step 2: Restyle rental detail**

Changes (spec Section 11.1):
- Screen title: vehicle make/model in `font-display` fontWeight 600
- Content sections with 24px spacing
- Cards: sage-wash bg for customer/vehicle, warm-stone for pricing
- Pricing: right-aligned `font-data`, gross total in `font-display` forest green
- "Rozpocznij zwrot" button: full-width primary at bottom

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/\(tabs\)/rentals/
git commit -m "feat(mobile): restyle rentals list and detail views"
```

---

## Task 18: Mobile — New Rental Wizard Screens

**Files:**
- Modify: `apps/mobile/app/(tabs)/new-rental/index.tsx` (customer selection)
- Modify: `apps/mobile/app/(tabs)/new-rental/vehicle.tsx`
- Modify: `apps/mobile/app/(tabs)/new-rental/dates.tsx`
- Modify: `apps/mobile/app/(tabs)/new-rental/contract.tsx`
- Modify: `apps/mobile/app/(tabs)/new-rental/photos.tsx`
- Modify: `apps/mobile/app/(tabs)/new-rental/signatures.tsx`
- Modify: `apps/mobile/app/(tabs)/new-rental/success.tsx`
- Modify: `apps/mobile/app/(tabs)/new-rental/_layout.tsx`

- [ ] **Step 1: Update wizard layout and all step screens**

Apply across all screens:
- Background: `colors.cream`
- WizardStepper already restyled (Task 14)
- Form inputs: bottom-border only (`borderBottomWidth: 1, borderBottomColor: colors.sand`), forest green on focus
- Labels: `font-body` fontWeight 500, warm-gray
- Search results: flat list, not dropdown
- Selection state: sage-wash bg + forest green checkmark

Per-screen specifics:
- **dates.tsx** (spec 11.2): native DateTimePicker rows, daily rate in `font-data`, pricing summary with gross total in `font-display` forest green
- **contract.tsx** (spec 11.4): warm-stone summary card, key-value pairs, RODO checkbox restyled
- **photos.tsx** (spec 11.3): 2x2 grid, warm-stone rectangles, dashed sand border on empty, terracotta X on captured
- **signatures.tsx** (spec 11.3): cream canvas with sand border, page indicator in `font-data` warm-gray
- **success.tsx** (spec 11.5): forest green checkmark circle, Fraunces heading, two stacked buttons

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/\(tabs\)/new-rental/
git commit -m "feat(mobile): restyle entire new rental wizard flow"
```

---

## Task 19: Mobile — Return Flow Screens

**Files:**
- Modify: `apps/mobile/app/return/_layout.tsx`
- Modify: `apps/mobile/app/return/[rentalId].tsx`
- Modify: `apps/mobile/app/return/mileage.tsx`
- Modify: `apps/mobile/app/return/damage-map.tsx`
- Modify: `apps/mobile/app/return/notes.tsx`
- Modify: `apps/mobile/app/return/confirm.tsx`
- Modify: `apps/mobile/src/components/CarDamageMap.tsx`
- Modify: `apps/mobile/src/components/DamageDetailModal.tsx`

- [ ] **Step 1: Update return flow screens**

Apply across all screens:
- Background: `colors.cream`
- WizardStepper already restyled
- Same form input pattern as new-rental

Per-screen specifics:
- **[rentalId].tsx**: rental details display, cream bg
- **mileage.tsx** (spec 11.6): large `font-data` 24px input, centered, distance calculation in forest green/amber-glow
- **damage-map.tsx** (spec 5.6): car silhouette in charcoal on cream, damage pins terracotta with white `font-data` numbers
- **DamageDetailModal.tsx**: convert to bottom sheet style — handle bar (40px sand), sage-wash bg, 12px top radius
- **notes.tsx** (spec 11.7): full-width textarea, bottom-border style, "Opcjonalne" label
- **confirm.tsx** (spec 11.8): summary card, "Zatwierdź zwrot" primary button, spinner on loading

- [ ] **Step 2: Update CarDamageMap.tsx**

- Car silhouette stroke: `colors.charcoal` on cream
- Pin markers: `colors.terracotta` circles with cream/white numbers

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/return/ apps/mobile/src/components/CarDamageMap.tsx apps/mobile/src/components/DamageDetailModal.tsx
git commit -m "feat(mobile): restyle return flow and damage map"
```

---

## Task 20: Mobile — Login & Profile Screens

**Files:**
- Modify: `apps/mobile/app/login.tsx`
- Modify: `apps/mobile/app/(tabs)/profile.tsx`

- [ ] **Step 1: Redesign login screen**

Changes (spec Section 7.2):
- Background: `colors.cream`
- KITEK wordmark: `font-display` fontWeight 600, 28px, forest green, centered
- Form in upper-third (not dead-center): `paddingTop: '25%'`
- Inputs: bottom-border style (sand, forest green on focus)
- Login button: full-width primary forest green
- Error: terracotta text

- [ ] **Step 2: Redesign profile screen**

Changes (spec Section 5.8):
- Background: `colors.cream`
- Avatar: `font-display` initial in forest green circle, cream text
- Settings list: sand dividers (`borderBottomWidth: 1, borderBottomColor: colors.sand`)
- Toggle switches: `trackColor` = `{ false: colors.sand, true: colors.forestGreen }`
- Version: `font-data`, warm-gray, small, bottom

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/login.tsx apps/mobile/app/\(tabs\)/profile.tsx
git commit -m "feat(mobile): restyle login and profile screens"
```

---

## Task 21: Final Verification & Cleanup

**Files:**
- All modified files

- [ ] **Step 1: Full web build verification**

Run: `cd apps/web && npx next build 2>&1 | tail -30`
Expected: Build succeeds with no new errors

- [ ] **Step 2: TypeScript check**

Run: `cd apps/web && npx tsc --noEmit 2>&1 | tail -20`
Expected: No new type errors

- [ ] **Step 3: Mobile compilation check**

Run: `cd apps/mobile && npx expo start --clear 2>&1 | head -30`
Expected: App compiles and starts

- [ ] **Step 4: Clean up any remaining dark mode references**

Search for `className="dark"` or dark-mode-specific classes across the web app and remove them:
```bash
grep -r "dark:" apps/web/src/ --include="*.tsx" --include="*.ts" -l
```
Remove any `dark:` variant classes that are no longer needed.

- [ ] **Step 5: Add .superpowers to .gitignore if not present**

```bash
echo ".superpowers/" >> .gitignore
```

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup — remove dark mode references, verify builds"
```

---

## Parallelization Guide

Tasks can be grouped into independent tracks:

**Track A — Web Foundation (sequential):**
Task 1 → Task 2 → Task 3

**Track B — Web Layout & Data (depends on Track A):**
Task 4 → Task 5

**Track C — Web Pages (depends on Track B — needs restyled data tables):**
Task 6, Task 7 (can run in parallel) → Task 8 → Task 9 → Task 10 → Task 11

**Track D — Mobile Foundation (independent of web tracks):**
Task 12 → Task 13 → Task 14 → Task 15

**Track E — Mobile Screens (depends on Track D):**
Task 16 → Task 17 → Task 18 → Task 19 → Task 20

**Task 21 — Final verification (depends on all tracks)**

- Tracks A+B and D can run fully in parallel (web vs mobile).
- Task 7 (login page) can run in parallel with Task 6 (dashboard) since they share no files.
- Track E screens are sequential because they may share component patterns.
- Task 21 must wait for all tracks to complete.
