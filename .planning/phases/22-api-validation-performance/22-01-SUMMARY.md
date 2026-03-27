---
phase: 22-api-validation-performance
plan: 01
subsystem: api
tags: [class-validator, dto, validation, nestjs]

requires:
  - phase: 20-security-hardening
    provides: Existing DTO validation patterns and validator infrastructure
provides:
  - Cross-field date validation on CalendarQueryDto (from < to, max 6 months)
  - Cross-field date validation on CreateRentalDto (endDate > startDate)
  - Reusable DateAfterValidator for cross-field date comparisons
  - MaxLength constraints on CreateVehicleDto make/model and UploadPhotoDto position
  - IsIn validation on NotificationQueryDto.isRead
  - Correct route order in NotificationsController (static before parameterized)
affects: [23-mobile-ux-fixes, 26-code-quality]

tech-stack:
  added: []
  patterns: [cross-field-validation-with-ValidatorConstraint, reusable-custom-validators]

key-files:
  created:
    - apps/api/src/common/validators/date-after.validator.ts
  modified:
    - apps/api/src/rentals/dto/calendar-query.dto.ts
    - apps/api/src/rentals/dto/create-rental.dto.ts
    - apps/api/src/vehicles/dto/create-vehicle.dto.ts
    - apps/api/src/photos/dto/upload-photo.dto.ts
    - apps/api/src/notifications/dto/notification-query.dto.ts
    - apps/api/src/notifications/notifications.controller.ts

key-decisions:
  - "CalendarRangeValidator uses 184-day threshold for 6-month max range"
  - "DateAfterValidator created as reusable validator in common/validators for cross-field date ordering"

patterns-established:
  - "Cross-field validation: use @ValidatorConstraint + @Validate on the dependent field, access related fields via args.object"
  - "Reusable validators: place in apps/api/src/common/validators/ with ValidatorConstraintInterface"

requirements-completed: [AVAL-03, AVAL-04, AVAL-05, AVAL-06, AVAL-07, AVAL-08]

duration: 5min
completed: 2026-03-27
---

# Phase 22 Plan 01: DTO Validation Gaps Summary

**Cross-field date validators on CalendarQueryDto and CreateRentalDto, MaxLength on vehicle make/model and photo position, IsIn on notification isRead, and route order fix in NotificationsController**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-27T22:40:33Z
- **Completed:** 2026-03-27T22:45:33Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- CalendarQueryDto rejects reversed dates and ranges exceeding 6 months (184 days)
- CreateRentalDto rejects endDate <= startDate via reusable DateAfterValidator
- CreateVehicleDto make/model bounded at 100 chars, UploadPhotoDto position at 50 chars
- NotificationQueryDto.isRead restricted to 'true'/'false' with @IsIn
- markAllAsRead route moved before :id/read in NotificationsController to prevent route shadowing

## Task Commits

Each task was committed atomically:

1. **Task 1: Add cross-field date validations and MaxLength constraints to DTOs** - `56be346` (feat)
2. **Task 2: Fix NotificationQueryDto.isRead validation and controller route order** - `7a245a1` (fix)

## Files Created/Modified
- `apps/api/src/common/validators/date-after.validator.ts` - Reusable cross-field date ordering validator
- `apps/api/src/rentals/dto/calendar-query.dto.ts` - CalendarRangeValidator for from < to and 6-month max
- `apps/api/src/rentals/dto/create-rental.dto.ts` - @Validate(DateAfterValidator) on endDate
- `apps/api/src/vehicles/dto/create-vehicle.dto.ts` - @MaxLength(100) on make and model
- `apps/api/src/photos/dto/upload-photo.dto.ts` - @MaxLength(50) on position
- `apps/api/src/notifications/dto/notification-query.dto.ts` - @IsIn(['true', 'false']) on isRead
- `apps/api/src/notifications/notifications.controller.ts` - Route order fix (static before parameterized)

## Decisions Made
- CalendarRangeValidator uses 184-day threshold for 6-month max range (covers all month lengths)
- DateAfterValidator created as reusable validator in common/validators for any cross-field date ordering needs

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 6 AVAL requirements (03-08) addressed
- Pre-existing test failures (6 tests in 3 suites) unrelated to this plan's changes remain
- Ready for phase 22 plan 02 (if any) or next phase

---
*Phase: 22-api-validation-performance*
*Completed: 2026-03-27*
