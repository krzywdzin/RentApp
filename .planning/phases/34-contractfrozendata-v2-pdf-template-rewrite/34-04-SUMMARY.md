---
phase: 34-contractfrozendata-v2-pdf-template-rewrite
plan: 04
subsystem: web, ui
tags: [tiptap, rich-text-editor, admin-settings, next.js, shadcn]

# Dependency graph
requires:
  - phase: 34-contractfrozendata-v2-pdf-template-rewrite
    plan: 01
    provides: "AppSetting model + Settings API (GET/PUT key-value)"
provides:
  - "Reusable TipTapEditor component with toolbar (bold, italic, lists, headings)"
  - "Admin settings page at /ustawienia with terms editor"
  - "Sidebar navigation entry for Ustawienia"
affects: [34-05, 35-second-driver]

# Tech tracking
tech-stack:
  added: ["@tiptap/react", "@tiptap/starter-kit", "@tiptap/pm"]
  patterns:
    - "TipTap v3 rich text editor with StarterKit and heading levels [2,3]"
    - "Admin settings page pattern: fetch setting on mount, save via PUT"

key-files:
  created:
    - apps/web/src/components/tiptap-editor.tsx
    - apps/web/src/app/(admin)/ustawienia/page.tsx
  modified:
    - apps/web/package.json
    - apps/web/src/components/layout/sidebar.tsx

key-decisions:
  - "TipTap v3 (3.22.3) used instead of v2 -- latest stable, same API surface"
  - "Headings limited to H2/H3 only -- H1 too large for contract terms"
  - "Editor toolbar uses lucide icons with shadcn ghost buttons for consistency"

patterns-established:
  - "TipTapEditor: reusable rich text component with content/onChange props"
  - "Settings page pattern: apiClient GET on mount, PUT on save, sonner toast feedback"

requirements-completed: [UMOWA-01]

# Metrics
duration: 3min
completed: 2026-04-12
---

# Phase 34 Plan 04: Admin Terms Editor Summary

**TipTap v3 rich text editor for admin settings page -- editable default rental terms at /ustawienia with save to Settings API**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-12T21:21:02Z
- **Completed:** 2026-04-12T21:24:16Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- TipTap v3 installed with StarterKit, react, and pm packages
- Reusable TipTapEditor component with toolbar (bold, italic, ordered/bullet list, H2, H3)
- Admin settings page at /ustawienia loads and saves default rental terms via Settings API
- Sidebar navigation updated with Ustawienia entry (Settings icon)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install TipTap + create reusable editor component** - `2c2a3fb` (feat)
2. **Task 2: Admin settings page with terms editor** - `c15d731` (feat, bundled with 34-03 commit)

**Plan metadata:** (pending) (docs: complete plan)

## Files Created/Modified
- `apps/web/src/components/tiptap-editor.tsx` - Reusable TipTap rich text editor with toolbar and onChange callback
- `apps/web/src/app/(admin)/ustawienia/page.tsx` - Admin settings page with terms editor, API integration, save button
- `apps/web/package.json` - Added @tiptap/react, @tiptap/starter-kit, @tiptap/pm dependencies
- `apps/web/src/components/layout/sidebar.tsx` - Added Ustawienia nav item with Settings icon

## Decisions Made
- Used TipTap v3 (3.22.3) instead of v2 as recommended by research -- latest stable release
- Heading levels restricted to [2, 3] to prevent overly large headings in contract terms
- Used lucide-react icons for toolbar buttons to match project icon library

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Task 2 files (settings page, sidebar) were already committed as part of the 34-03 commit (c15d731) due to parallel plan execution. Content verified correct.
- Pre-existing TypeScript errors in klienci and wynajmy pages (from Phase 33 schema changes) -- unrelated to this plan, not addressed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- TipTapEditor component ready for reuse in mobile WebView (Phase 34-05 or later)
- Settings page functional, pending integration testing with live API
- Default terms can be edited and saved by admin users

---
*Phase: 34-contractfrozendata-v2-pdf-template-rewrite*
*Completed: 2026-04-12*
