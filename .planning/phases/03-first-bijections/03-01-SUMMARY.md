---
phase: 03-first-bijections
plan: 01
subsystem: animation
tags: [easing, bijection-router, dual-mode-render, step-description]

# Dependency graph
requires:
  - phase: 02-vertical-slice
    provides: "Animation engine, app controller, canvas rendering pipeline"
provides:
  - "easeInOutCubic and lerp easing utilities"
  - "Bijection router with register/getSteps for structure pair lookup"
  - "Step description DOM panel below canvas"
  - "Dual-mode render function (static vs animation)"
  - "loadBijectionSteps wired into all state change handlers"
affects: [03-02, 03-03, 04-bridge-bijections]

# Tech tracking
tech-stack:
  added: []
  patterns: ["bidirectional registry (forward/reverse key mapping)", "dual-mode render (animation vs static)"]

key-files:
  created: [js/core/easing.js, js/bijections/router.js]
  modified: [index.html, css/style.css, js/main.js]

key-decisions:
  - "Easing applied in render() not animation engine -- prevents double-easing"
  - "Router uses sourceKey|targetKey composite keys with automatic reverse registration"
  - "updateStepDescription shows structure labels when no bijection available for pair"

patterns-established:
  - "Bijection modules self-register via router.register(mod) with META.source/target"
  - "Step objects must have drawFrame(ctx, easedProgress, opts) and description properties"

requirements-completed: [ANIM-06, UICT-04]

# Metrics
duration: 2min
completed: 2026-02-23
---

# Phase 3 Plan 1: Bijection Infrastructure Summary

**Cubic easing utility, bidirectional bijection router skeleton, step description panel, and dual-mode render function switching between static and animation paths**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-24T05:21:48Z
- **Completed:** 2026-02-24T05:24:25Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created easeInOutCubic and lerp easing utilities with input clamping
- Built bidirectional bijection router that maps structure pairs to step generators
- Added step description panel below canvas with context-aware messaging
- Implemented dual-mode render: animation mode applies easing and delegates to step.drawFrame, static mode preserves existing side-by-side rendering

## Task Commits

Each task was committed atomically:

1. **Task 1: Create easing utility and bijection router skeleton** - `d7d306e` (feat)
2. **Task 2: Add step description panel, wire router and easing into main.js render** - `fa1af5a` (feat)

## Files Created/Modified
- `js/core/easing.js` - easeInOutCubic and lerp exports for smooth animation transitions
- `js/bijections/router.js` - Bidirectional registry with register() and getSteps() for structure pair lookup
- `index.html` - Added #step-description div between canvas-container and controls
- `css/style.css` - Added .step-description styling (centered, bordered panel)
- `js/main.js` - Imported easing/router, added loadBijectionSteps/updateStepDescription, dual-mode render

## Decisions Made
- Easing is applied in render() to the raw progress value before passing to drawFrame -- the animation engine stores raw linear progress, preventing double-easing (per Pitfall 2 from Phase 3 research)
- Router uses composite string keys (sourceKey|targetKey) with automatic reverse registration for bidirectional lookup
- Step description shows structure labels and "No bijection available" when router returns null for a pair, vs default message when same structure selected

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Router is empty and ready to accept bijection module registrations in Plans 02 and 03
- Dual-mode render ready to consume step arrays with drawFrame(ctx, easedProgress, opts) interface
- Step description panel will automatically update when bijection steps are loaded
- All existing static rendering preserved -- no regressions

## Self-Check: PASSED

All files exist. All commits verified.

---
*Phase: 03-first-bijections*
*Completed: 2026-02-23*
