---
phase: 24-web-quality-accessibility
plan: 04
subsystem: ui
tags: [accessibility, aria, keyboard-navigation, a11y, combobox, svg]

# Dependency graph
requires:
  - phase: 24-web-quality-accessibility
    provides: "Web admin pages requiring accessibility fixes"
provides:
  - "Keyboard-accessible interactive divs on vehicle/customer detail pages"
  - "Collapsible card with aria-expanded on users page"
  - "ARIA-labeled filter bar selects and search inputs"
  - "Keyboard-accessible calendar rental blocks"
  - "Combobox pattern on customer search dropdown"
  - "Keyboard-focusable damage SVG pins"
affects: [26-code-quality]

# Tech tracking
tech-stack:
  added: []
  patterns: [role-button-tabindex-onkeydown, combobox-aria-pattern, svg-focusable-pins]

key-files:
  created: []
  modified:
    - apps/web/src/app/(admin)/pojazdy/[id]/page.tsx
    - apps/web/src/app/(admin)/klienci/[id]/page.tsx
    - apps/web/src/app/(admin)/uzytkownicy/page.tsx
    - apps/web/src/app/(admin)/audyt/filter-bar.tsx
    - apps/web/src/components/layout/top-bar.tsx
    - apps/web/src/app/(admin)/pojazdy/filter-bar.tsx
    - apps/web/src/app/(admin)/wynajmy/calendar-view.tsx
    - apps/web/src/app/(admin)/wynajmy/nowy/page.tsx
    - apps/web/src/components/photos/damage-comparison.tsx

key-decisions:
  - "role=button + tabIndex=0 + onKeyDown Enter/Space pattern for all interactive divs"
  - "aria-label on SelectTrigger for filter bars (vs htmlFor) since Radix Select has no input id"
  - "SVG <g> focusable=true + tabIndex=0 for damage pins in TooltipTrigger"
  - "Full combobox ARIA pattern with ArrowDown/ArrowUp/Escape keyboard navigation"

patterns-established:
  - "Interactive div pattern: role=button, tabIndex=0, onKeyDown for Enter/Space"
  - "Combobox pattern: role=combobox, aria-expanded, aria-haspopup=listbox, aria-controls, ArrowDown/Up/Escape"
  - "SVG focusable pattern: <g tabIndex=0 role=button aria-label focusable=true>"

requirements-completed: [WA11Y-01, WA11Y-02, WA11Y-03, WA11Y-04, WA11Y-05, WA11Y-06, WA11Y-07, WA11Y-08]

# Metrics
duration: 3min
completed: 2026-03-27
---

# Phase 24 Plan 04: Keyboard & ARIA Accessibility Summary

**Keyboard navigation and ARIA attributes for all interactive web admin elements: clickable divs, collapsible cards, filter selects, calendar blocks, combobox customer search, and focusable SVG damage pins**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-27T23:26:30Z
- **Completed:** 2026-03-27T23:29:58Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- All interactive divs on vehicle and customer detail pages now have role=button, tabIndex=0, and onKeyDown handlers for Enter/Space activation
- Collapsible "Nowy uzytkownik" card header has aria-expanded, role=button, and keyboard support
- Audit filter bar selects, logout button, and vehicle search input all have proper aria-labels
- Calendar rental blocks are keyboard-accessible with role=button, tabIndex, and aria-label
- Customer search dropdown follows combobox ARIA pattern with listbox results, option roles, and arrow key navigation
- Damage SVG pins are keyboard-focusable with focusable=true, tabIndex=0, role=button, and aria-label

## Task Commits

Each task was committed atomically:

1. **Task 1: Interactive divs, collapsible cards, filter labels, and simple ARIA fixes** - `8a3f5b4` (feat)
2. **Task 2: Calendar blocks, customer search combobox, and damage pin accessibility** - `4e08538` (feat)

## Files Created/Modified
- `apps/web/src/app/(admin)/pojazdy/[id]/page.tsx` - role=button, tabIndex, onKeyDown on rental history items
- `apps/web/src/app/(admin)/klienci/[id]/page.tsx` - role=button, tabIndex, onKeyDown on rental history items
- `apps/web/src/app/(admin)/uzytkownicy/page.tsx` - aria-expanded, role=button, keyboard handler on collapsible card
- `apps/web/src/app/(admin)/audyt/filter-bar.tsx` - aria-label on filter select triggers
- `apps/web/src/components/layout/top-bar.tsx` - aria-label="Wyloguj" on logout button
- `apps/web/src/app/(admin)/pojazdy/filter-bar.tsx` - aria-label on vehicle search input
- `apps/web/src/app/(admin)/wynajmy/calendar-view.tsx` - role=button, tabIndex, aria-label, onKeyDown on rental blocks
- `apps/web/src/app/(admin)/wynajmy/nowy/page.tsx` - combobox pattern with listbox, option roles, arrow key nav
- `apps/web/src/components/photos/damage-comparison.tsx` - tabIndex, focusable, role=button, aria-label on SVG pins

## Decisions Made
- Used role=button + tabIndex=0 + onKeyDown (Enter/Space) pattern consistently for all interactive non-button elements
- Used aria-label on SelectTrigger instead of htmlFor since Radix Select does not expose a native input element
- Used SVG `<g focusable="true" tabIndex={0}>` to make damage pins keyboard-reachable while keeping them inside TooltipTrigger
- Implemented full combobox ARIA pattern with ArrowDown/ArrowUp for result navigation and Escape to close

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed prettier formatting in wynajmy/nowy/page.tsx**
- **Found during:** Task 2 (Customer search combobox)
- **Issue:** Pre-existing prettier formatting error in formSchema z chain prevented build from passing for this file
- **Fix:** Ran prettier --write on the file to fix all formatting issues
- **Files modified:** apps/web/src/app/(admin)/wynajmy/nowy/page.tsx
- **Verification:** Build compiles successfully, no prettier errors in modified files
- **Committed in:** 4e08538 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed prettier line-length in top-bar.tsx**
- **Found during:** Task 1 (Logout button aria-label)
- **Issue:** Adding aria-label to single-line Button exceeded prettier line length
- **Fix:** Split Button attributes across multiple lines
- **Files modified:** apps/web/src/components/layout/top-bar.tsx
- **Verification:** Build compiles without prettier error for this file
- **Committed in:** 8a3f5b4 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for build to pass. No scope creep.

## Issues Encountered
- Pre-existing prettier errors in pojazdy/columns.tsx and lib/csv-export.ts cause build to fail but are unrelated to this plan's changes -- logged as out-of-scope

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All keyboard navigation and ARIA attributes are in place for web admin
- Ready for remaining accessibility plans in phase 24

---
*Phase: 24-web-quality-accessibility*
*Completed: 2026-03-27*
