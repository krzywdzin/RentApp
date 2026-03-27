# Phase 24: Web Quality & Accessibility - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Web admin panel error handling, form validation, accessibility (keyboard nav, ARIA), UI consistency (shared components), state management fixes, performance fixes, and responsive design. 32 requirements across WERR, WVAL, WA11Y, WUI, WPERF, WRESP categories.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — web quality phase. Audit references:
- WEB-AUDIT: sections 2 (error handling), 3 (accessibility), 5 (form validation), 8 (UI consistency), 9 (error boundaries), 12 (state management), 14 (responsive design)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Shadcn UI components at apps/web/src/components/ui/
- React Query hooks at apps/web/src/hooks/queries/
- Next.js App Router with admin and portal layouts

### Integration Points
- All detail pages need isError handling
- Form pages need validation fixes
- Interactive divs need keyboard support
- List pages need pagination reset on filter change

</code_context>

<specifics>
## Specific Ideas
No specific requirements — driven by audit findings.
</specifics>

<deferred>
## Deferred Ideas
None.
</deferred>
